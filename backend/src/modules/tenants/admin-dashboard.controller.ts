import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminDashboardController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
  ) {}

  @Get('stats')
  async getStats() {
    const result = await this.dashboardService.getStats();
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('businesses-over-time')
  async getBusinessesOverTime(@Query('days') days?: string) {
    const result = await this.dashboardService.getBusinessesOverTime(
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('contact-clicks-by-type')
  async getContactClicksByType(@Query('days') days?: string) {
    const result = await this.dashboardService.getContactClicksByType(
      days ? parseInt(days, 10) : 30,
    );
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
