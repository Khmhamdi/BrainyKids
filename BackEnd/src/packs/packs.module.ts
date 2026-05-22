import { Module } from '@nestjs/common';
import { PacksController } from './packs.controller';
import { PacksService } from './packs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({ imports: [PrismaModule, NotificationsModule], controllers: [PacksController], providers: [PacksService] })
export class PacksModule {}
