import { Module } from '@nestjs/common';
import { EventStoreService } from './event-store.service';
import { EventHandlersService } from './event-handlers.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [EventStoreService, EventHandlersService],
  exports: [EventStoreService],
})
export class EventsModule {}
