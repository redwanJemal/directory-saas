import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReviewVerificationSchema, ReviewVerificationDto } from './dto';

@ApiTags('Admin Verifications')
@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page || '1', 10) || 1);
    const parsedPageSize = Math.min(
      100,
      Math.max(1, parseInt(pageSize || '20', 10) || 20),
    );

    const result = await this.verificationService.listVerificationRequests(
      parsedPage,
      parsedPageSize,
      { status },
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch(':id')
  async review(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body(new ZodValidationPipe(ReviewVerificationSchema))
    dto: ReviewVerificationDto,
  ) {
    const result = await this.verificationService.reviewVerification(
      id,
      userId,
      dto,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
