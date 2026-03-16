import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WeddingsService } from './weddings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { JwtPayload } from '../auth/jwt.strategy';
import {
  UpdateWeddingSchema,
  UpdateWeddingDto,
  CreateEventSchema,
  CreateEventDto,
  CreateGuestSchema,
  CreateGuestDto,
  CreateBudgetItemSchema,
  CreateBudgetItemDto,
  UpdateBudgetSchema,
  UpdateBudgetDto,
  CreateChecklistTaskSchema,
  CreateChecklistTaskDto,
  InviteCollaboratorSchema,
  InviteCollaboratorDto,
} from './dto';

@ApiTags('Weddings')
@Controller('weddings')
@UseGuards(JwtAuthGuard)
export class WeddingsController {
  constructor(private readonly weddingsService: WeddingsService) {}

  // === Wedding ===

  @Get('me')
  async getWedding(@CurrentUser() user: JwtPayload) {
    const result = await this.weddingsService.getWedding(user.sub);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me')
  async updateWedding(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateWeddingSchema)) dto: UpdateWeddingDto,
  ) {
    const result = await this.weddingsService.updateWedding(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Events ===

  @Post('me/events')
  @HttpCode(HttpStatus.CREATED)
  async createEvent(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateEventSchema)) dto: CreateEventDto,
  ) {
    const result = await this.weddingsService.createEvent(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/events/:id')
  async deleteEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.deleteEvent(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Guests ===

  @Get('me/guests')
  async listGuests(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('group') group?: string,
    @Query('side') side?: string,
    @Query('rsvpStatus') rsvpStatus?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize || '20', 10) || 20));
    const filters = { group, side, rsvpStatus };

    const result = await this.weddingsService.listGuests(
      user.sub,
      pageNum,
      pageSizeNum,
      filters,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/guests')
  @HttpCode(HttpStatus.CREATED)
  async createGuest(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateGuestSchema)) dto: CreateGuestDto,
  ) {
    const result = await this.weddingsService.createGuest(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/guests/:id')
  async deleteGuest(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.deleteGuest(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/guests/import')
  @HttpCode(HttpStatus.CREATED)
  async importGuests(
    @CurrentUser() user: JwtPayload,
    @Body() body: { guests: CreateGuestDto[] },
  ) {
    const result = await this.weddingsService.importGuests(user.sub, body.guests);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Budget ===

  @Get('me/budget')
  async getBudget(@CurrentUser() user: JwtPayload) {
    const result = await this.weddingsService.getBudget(user.sub);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/budget')
  async updateBudget(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(UpdateBudgetSchema)) dto: UpdateBudgetDto,
  ) {
    const result = await this.weddingsService.updateBudget(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/budget/items')
  @HttpCode(HttpStatus.CREATED)
  async createBudgetItem(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateBudgetItemSchema)) dto: CreateBudgetItemDto,
  ) {
    const result = await this.weddingsService.createBudgetItem(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/budget/items/:id')
  async deleteBudgetItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.deleteBudgetItem(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Checklist ===

  @Get('me/checklist')
  async listChecklist(@CurrentUser() user: JwtPayload) {
    const result = await this.weddingsService.listChecklist(user.sub);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/checklist')
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateChecklistTaskSchema)) dto: CreateChecklistTaskDto,
  ) {
    const result = await this.weddingsService.createTask(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/checklist/:id')
  async toggleTask(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.toggleTask(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/checklist/:id')
  async deleteTask(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.deleteTask(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Collaborators ===

  @Post('me/collaborators')
  @HttpCode(HttpStatus.CREATED)
  async inviteCollaborator(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(InviteCollaboratorSchema)) dto: InviteCollaboratorDto,
  ) {
    const result = await this.weddingsService.inviteCollaborator(user.sub, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/collaborators/:id')
  async removeCollaborator(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    const result = await this.weddingsService.removeCollaborator(user.sub, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
