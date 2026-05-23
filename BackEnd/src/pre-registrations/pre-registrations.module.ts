import { Module } from '@nestjs/common';
import { PreRegistrationsController } from './pre-registrations.controller';
import { PreRegistrationsService } from './pre-registrations.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PreRegistrationsController],
  providers: [PreRegistrationsService],
})
export class PreRegistrationsModule {}
