import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ServiceResult } from '../../common/types';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { ErrorCodes } from '../../common/constants/error-codes';
import {
  UpdateWeddingDto,
  CreateEventDto,
  CreateGuestDto,
  CreateBudgetItemDto,
  UpdateBudgetDto,
  CreateChecklistTaskDto,
  InviteCollaboratorDto,
} from './dto';

@Injectable()
export class WeddingsService {
  constructor(private readonly prisma: PrismaService) {}

  // === Wedding ===

  async getWedding(clientId: string): Promise<ServiceResult<unknown>> {
    let wedding = await this.prisma.wedding.findUnique({
      where: { clientId },
      include: {
        events: { orderBy: { sortOrder: 'asc' } },
        collaborators: true,
      },
    });

    if (!wedding) {
      wedding = await this.prisma.wedding.create({
        data: {
          clientId,
          title: 'My Wedding',
          currency: 'ETB',
        },
        include: {
          events: { orderBy: { sortOrder: 'asc' } },
          collaborators: true,
        },
      });
    }

    return ServiceResult.ok(wedding);
  }

  async updateWedding(
    clientId: string,
    dto: UpdateWeddingDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.prisma.wedding.findUnique({
      where: { clientId },
    });

    if (!wedding) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Wedding not found');
    }

    const updated = await this.prisma.wedding.update({
      where: { clientId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.brideName !== undefined && { brideName: dto.brideName }),
        ...(dto.groomName !== undefined && { groomName: dto.groomName }),
        ...(dto.weddingDate !== undefined && { weddingDate: dto.weddingDate ? new Date(dto.weddingDate) : null }),
        ...(dto.venue !== undefined && { venue: dto.venue }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.guestCount !== undefined && { guestCount: dto.guestCount }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata === null ? Prisma.JsonNull : dto.metadata as Prisma.InputJsonValue }),
      },
      include: {
        events: { orderBy: { sortOrder: 'asc' } },
        collaborators: true,
      },
    });

    return ServiceResult.ok(updated);
  }

  // === Events ===

  async createEvent(
    clientId: string,
    dto: CreateEventDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const event = await this.prisma.weddingEvent.create({
      data: {
        weddingId: wedding.data!.id,
        name: dto.name,
        description: dto.description,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        venue: dto.venue,
        address: dto.address,
        sortOrder: dto.sortOrder ?? 0,
        metadata: dto.metadata ? dto.metadata as Prisma.InputJsonValue : undefined,
      },
    });

    return ServiceResult.ok(event);
  }

  async deleteEvent(
    clientId: string,
    eventId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const event = await this.prisma.weddingEvent.findFirst({
      where: { id: eventId, weddingId: wedding.data!.id },
    });

    if (!event) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Event not found');
    }

    await this.prisma.weddingEvent.delete({ where: { id: eventId } });

    return ServiceResult.ok({ deleted: true });
  }

  // === Guests ===

  async listGuests(
    clientId: string,
    page: number,
    pageSize: number,
    filters?: { group?: string; rsvpStatus?: string },
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const where: Record<string, unknown> = { weddingId: wedding.data!.id };
    if (filters?.group) where.group = filters.group;
    if (filters?.rsvpStatus) where.rsvpStatus = filters.rsvpStatus;

    const [items, totalCount] = await Promise.all([
      this.prisma.guest.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.guest.count({ where }),
    ]);

    return ServiceResult.ok(paginate(items, totalCount, { page, pageSize }));
  }

  async createGuest(
    clientId: string,
    dto: CreateGuestDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const guest = await this.prisma.guest.create({
      data: {
        weddingId: wedding.data!.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        group: dto.group,
        rsvpStatus: dto.rsvpStatus ?? 'PENDING',
        plusOnes: dto.plusOnes ?? 0,
        dietaryNotes: dto.dietaryNotes,
        tableNumber: dto.tableNumber,
        metadata: dto.metadata ? dto.metadata as Prisma.InputJsonValue : undefined,
      },
    });

    return ServiceResult.ok(guest);
  }

  async deleteGuest(
    clientId: string,
    guestId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const guest = await this.prisma.guest.findFirst({
      where: { id: guestId, weddingId: wedding.data!.id },
    });

    if (!guest) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Guest not found');
    }

    await this.prisma.guest.delete({ where: { id: guestId } });

    return ServiceResult.ok({ deleted: true });
  }

  async importGuests(
    clientId: string,
    guests: CreateGuestDto[],
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const created = await this.prisma.guest.createMany({
      data: guests.map((g) => ({
        weddingId: wedding.data!.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        group: g.group,
        rsvpStatus: g.rsvpStatus ?? 'PENDING',
        plusOnes: g.plusOnes ?? 0,
        dietaryNotes: g.dietaryNotes,
        tableNumber: g.tableNumber,
        metadata: g.metadata ? g.metadata as Prisma.InputJsonValue : undefined,
      })),
    });

    return ServiceResult.ok({ imported: created.count });
  }

  // === Budget ===

  async getBudget(clientId: string): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const items = await this.prisma.budgetItem.findMany({
      where: { weddingId: wedding.data!.id },
      orderBy: { createdAt: 'asc' },
    });

    const spent = items.reduce(
      (sum, item) => sum + Number(item.actualCost ?? 0),
      0,
    );
    const paidCount = items.filter((item) => item.isPaid).length;
    const estimated = items.reduce(
      (sum, item) => sum + Number(item.estimatedCost ?? 0),
      0,
    );

    return ServiceResult.ok({
      budget: Number(wedding.data!.budget ?? 0),
      currency: wedding.data!.currency,
      spent,
      paidCount,
      estimated,
      remaining: Number(wedding.data!.budget ?? 0) - spent,
      items,
    });
  }

  async updateBudget(
    clientId: string,
    dto: UpdateBudgetDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.prisma.wedding.findUnique({
      where: { clientId },
    });

    if (!wedding) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Wedding not found');
    }

    const updated = await this.prisma.wedding.update({
      where: { clientId },
      data: {
        budget: dto.budget,
        ...(dto.currency !== undefined && { currency: dto.currency }),
      },
    });

    return ServiceResult.ok({
      budget: Number(updated.budget ?? 0),
      currency: updated.currency,
    });
  }

  async createBudgetItem(
    clientId: string,
    dto: CreateBudgetItemDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const item = await this.prisma.budgetItem.create({
      data: {
        weddingId: wedding.data!.id,
        category: dto.category,
        description: dto.description,
        estimatedCost: dto.estimatedCost,
        actualCost: dto.actualCost ?? null,
        isPaid: dto.isPaid ?? false,
        paidDate: dto.paidDate ? new Date(dto.paidDate) : null,
        vendor: dto.vendor,
        notes: dto.notes,
      },
    });

    return ServiceResult.ok(item);
  }

  async deleteBudgetItem(
    clientId: string,
    itemId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const item = await this.prisma.budgetItem.findFirst({
      where: { id: itemId, weddingId: wedding.data!.id },
    });

    if (!item) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Budget item not found');
    }

    await this.prisma.budgetItem.delete({ where: { id: itemId } });

    return ServiceResult.ok({ deleted: true });
  }

  // === Checklist ===

  async listChecklist(clientId: string): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const tasks = await this.prisma.checklistTask.findMany({
      where: { weddingId: wedding.data!.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return ServiceResult.ok(tasks);
  }

  async createTask(
    clientId: string,
    dto: CreateChecklistTaskDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const task = await this.prisma.checklistTask.create({
      data: {
        weddingId: wedding.data!.id,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status ?? 'TODO',
        category: dto.category,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    return ServiceResult.ok(task);
  }

  async toggleTask(
    clientId: string,
    taskId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const task = await this.prisma.checklistTask.findFirst({
      where: { id: taskId, weddingId: wedding.data!.id },
    });

    if (!task) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Task not found');
    }

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

    const updated = await this.prisma.checklistTask.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    return ServiceResult.ok(updated);
  }

  async deleteTask(
    clientId: string,
    taskId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const task = await this.prisma.checklistTask.findFirst({
      where: { id: taskId, weddingId: wedding.data!.id },
    });

    if (!task) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Task not found');
    }

    await this.prisma.checklistTask.delete({ where: { id: taskId } });

    return ServiceResult.ok({ deleted: true });
  }

  // === Collaborators ===

  async inviteCollaborator(
    clientId: string,
    dto: InviteCollaboratorDto,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    // Check if already invited
    const existing = await this.prisma.weddingCollaborator.findFirst({
      where: { weddingId: wedding.data!.id, userId: dto.userId },
    });

    if (existing) {
      return ServiceResult.fail(
        ErrorCodes.ALREADY_EXISTS,
        'Collaborator already invited',
      );
    }

    const collaborator = await this.prisma.weddingCollaborator.create({
      data: {
        weddingId: wedding.data!.id,
        userId: dto.userId,
        userType: dto.userType,
        role: dto.role ?? 'VIEWER',
      },
    });

    return ServiceResult.ok(collaborator);
  }

  async removeCollaborator(
    clientId: string,
    collaboratorId: string,
  ): Promise<ServiceResult<unknown>> {
    const wedding = await this.ensureWedding(clientId);
    if (!wedding.success) return wedding;

    const collaborator = await this.prisma.weddingCollaborator.findFirst({
      where: { id: collaboratorId, weddingId: wedding.data!.id },
    });

    if (!collaborator) {
      return ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Collaborator not found');
    }

    await this.prisma.weddingCollaborator.delete({
      where: { id: collaboratorId },
    });

    return ServiceResult.ok({ deleted: true });
  }

  // === Helpers ===

  private async ensureWedding(
    clientId: string,
  ): Promise<ServiceResult<{ id: string; budget: unknown; currency: string }>> {
    let wedding = await this.prisma.wedding.findUnique({
      where: { clientId },
      select: { id: true, budget: true, currency: true },
    });

    if (!wedding) {
      wedding = await this.prisma.wedding.create({
        data: {
          clientId,
          title: 'My Wedding',
          currency: 'ETB',
        },
        select: { id: true, budget: true, currency: true },
      });
    }

    return ServiceResult.ok(wedding);
  }
}
