import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: { user_id: string; title: string; message: string; type: string; link?: string }) {
    return this.prisma.notification.create({ data: dto });
  }

  // Crée ou met à jour (si même user+type+link), remet read=false si le message change
  async upsertByLink(dto: { user_id: string; title: string; message: string; type: string; link: string }) {
    const existing = await this.prisma.notification.findFirst({
      where: { user_id: dto.user_id, type: dto.type, link: dto.link },
    });
    if (existing) {
      return this.prisma.notification.update({
        where: { id: existing.id },
        data: { message: dto.message, read: false },
      });
    }
    return this.prisma.notification.create({ data: dto });
  }

  async findByUser(userId: string, excludeTypes: string[] = []) {
    return this.prisma.notification.findMany({
      where: {
        user_id: userId,
        ...(excludeTypes.length > 0 && { type: { notIn: excludeTypes } }),
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { read: true } });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { user_id: userId, read: false }, data: { read: true } });
  }

  async countUnread(userId: string, excludeTypes: string[] = []) {
    return this.prisma.notification.count({
      where: {
        user_id: userId,
        read: false,
        ...(excludeTypes.length > 0 && { type: { notIn: excludeTypes } }),
      },
    });
  }
}
