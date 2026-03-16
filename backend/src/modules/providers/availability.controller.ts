import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BlockDateSchema, BlockDateDto } from './dto';
import { ServiceResult } from '../../common/types';
import { ErrorCodes } from '../../common/constants/error-codes';

@Controller('availability')
@UseGuards(JwtAuthGuard)
export class AvailabilityController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('block')
  @HttpCode(HttpStatus.CREATED)
  async blockDate(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(BlockDateSchema)) dto: BlockDateDto,
  ) {
    const profile = await this.ensureProfile(tenantId);
    if (!profile) {
      const result = ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
      throw result.toHttpException();
    }

    const date = new Date(dto.date);

    // Upsert: create blocked entry or update existing to blocked
    const entry = await this.prisma.providerAvailability.upsert({
      where: {
        providerProfileId_date: {
          providerProfileId: profile.id,
          date,
        },
      },
      update: {
        isAvailable: false,
      },
      create: {
        providerProfileId: profile.id,
        date,
        isAvailable: false,
      },
    });

    return {
      id: entry.id,
      date: dto.date,
      type: 'blocked' as const,
    };
  }

  @Delete('block/:date')
  async unblockDate(
    @CurrentTenant() tenantId: string,
    @Param('date') dateStr: string,
  ) {
    const profile = await this.ensureProfile(tenantId);
    if (!profile) {
      const result = ServiceResult.fail(ErrorCodes.NOT_FOUND, 'Provider profile not found');
      throw result.toHttpException();
    }

    const date = new Date(dateStr);

    // Delete the blocked availability entry
    try {
      await this.prisma.providerAvailability.delete({
        where: {
          providerProfileId_date: {
            providerProfileId: profile.id,
            date,
          },
        },
      });
    } catch {
      // Entry may not exist, which is fine — treat as idempotent
    }

    return { deleted: true };
  }

  private async ensureProfile(tenantId: string) {
    let profile = await this.prisma.providerProfile.findUnique({
      where: { tenantId },
    });

    if (!profile) {
      profile = await this.prisma.providerProfile.create({
        data: { tenantId },
      });
    }

    return profile;
  }
}
