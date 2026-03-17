import {
  Controller,
  Get,
  Put,
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
import { ProvidersService } from './providers.service';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  UpdateProfileSchema,
  UpdateProfileDto,
  CreatePackageSchema,
  CreatePackageDto,
  UpdatePackageSchema,
  UpdatePackageDto,
  CreateFaqSchema,
  CreateFaqDto,
  UpdateFaqSchema,
  UpdateFaqDto,
  CreatePortfolioItemSchema,
  CreatePortfolioItemDto,
  UpdatePortfolioItemSchema,
  UpdatePortfolioItemDto,
  UpdateAvailabilitySchema,
  UpdateAvailabilityDto,
  ReorderSchema,
  ReorderDto,
  SetCategoriesSchema,
  SetCategoriesDto,
  SubmitVerificationSchema,
  SubmitVerificationDto,
} from './dto';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(
    private readonly providersService: ProvidersService,
    private readonly verificationService: VerificationService,
  ) {}

  // === Profile ===

  @Get('me')
  async getProfile(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.getProfile(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me')
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) dto: UpdateProfileDto,
  ) {
    const result = await this.providersService.updateProfile(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Categories ===

  @Get('me/categories')
  async getCategories(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.getCategories(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Put('me/categories')
  async setCategories(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(SetCategoriesSchema)) dto: SetCategoriesDto,
  ) {
    const result = await this.providersService.setCategories(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Packages ===

  @Get('me/packages')
  async listPackages(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.listPackages(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/packages')
  @HttpCode(HttpStatus.CREATED)
  async createPackage(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreatePackageSchema)) dto: CreatePackageDto,
  ) {
    const result = await this.providersService.createPackage(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/packages/reorder')
  async reorderPackages(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ReorderSchema)) dto: ReorderDto,
  ) {
    const result = await this.providersService.reorderPackages(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/packages/:id')
  async updatePackage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePackageSchema)) dto: UpdatePackageDto,
  ) {
    const result = await this.providersService.updatePackage(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/packages/:id')
  async deletePackage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.providersService.deletePackage(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === FAQs ===

  @Get('me/faqs')
  async listFaqs(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.listFaqs(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/faqs')
  @HttpCode(HttpStatus.CREATED)
  async createFaq(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreateFaqSchema)) dto: CreateFaqDto,
  ) {
    const result = await this.providersService.createFaq(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/faqs/reorder')
  async reorderFaqs(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ReorderSchema)) dto: ReorderDto,
  ) {
    const result = await this.providersService.reorderFaqs(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/faqs/:id')
  async updateFaq(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateFaqSchema)) dto: UpdateFaqDto,
  ) {
    const result = await this.providersService.updateFaq(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/faqs/:id')
  async deleteFaq(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.providersService.deleteFaq(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Portfolio ===

  @Get('me/portfolio')
  async listPortfolioItems(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.listPortfolioItems(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Post('me/portfolio')
  @HttpCode(HttpStatus.CREATED)
  async createPortfolioItem(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(CreatePortfolioItemSchema)) dto: CreatePortfolioItemDto,
  ) {
    const result = await this.providersService.createPortfolioItem(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/portfolio/reorder')
  async reorderPortfolioItems(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(ReorderSchema)) dto: ReorderDto,
  ) {
    const result = await this.providersService.reorderPortfolioItems(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/portfolio/:id')
  async updatePortfolioItem(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePortfolioItemSchema)) dto: UpdatePortfolioItemDto,
  ) {
    const result = await this.providersService.updatePortfolioItem(tenantId, id, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Delete('me/portfolio/:id')
  async deletePortfolioItem(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.providersService.deletePortfolioItem(tenantId, id);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Availability ===

  @Get('me/availability')
  async getAvailability(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.providersService.getAvailability(tenantId, startDate, endDate);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Patch('me/availability')
  async updateAvailability(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(UpdateAvailabilitySchema)) dto: UpdateAvailabilityDto,
  ) {
    const result = await this.providersService.updateAvailability(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Verification ===

  @Post('me/verification')
  @HttpCode(HttpStatus.CREATED)
  async submitVerification(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(SubmitVerificationSchema)) dto: SubmitVerificationDto,
  ) {
    const result = await this.verificationService.submitVerification(tenantId, dto);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  @Get('me/verification')
  async getVerificationStatus(@CurrentTenant() tenantId: string) {
    const result = await this.verificationService.getVerificationStatus(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }

  // === Dashboard ===

  @Get('dashboard/stats')
  async getDashboardStats(@CurrentTenant() tenantId: string) {
    const result = await this.providersService.getDashboardStats(tenantId);
    if (!result.success) throw result.toHttpException();
    return result.data;
  }
}
