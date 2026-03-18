import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import {
  PaymentsController,
  PaymentsWebhookController,
  AdminPaymentsController,
} from './payments.controller';

@Module({
  controllers: [
    PaymentsController,
    PaymentsWebhookController,
    AdminPaymentsController,
  ],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
