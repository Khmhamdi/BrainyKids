import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PreRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: any) {
    const reg = await this.prisma.preRegistration.create({ data: {
      child_full_name:  dto.child_full_name,
      date_of_birth:    new Date(dto.date_of_birth),
      gender:           dto.gender           ?? 'M',
      desired_class:    dto.desired_class,
      school_year:      dto.school_year,
      parent_full_name: dto.parent_full_name,
      parent_phone:     dto.parent_phone,
      parent_email:     dto.parent_email,
      parent_relation:  dto.parent_relation  ?? 'father',
      message:          dto.message          ?? null,
    }});

    // Notifier tous les admins
    const admins = await this.prisma.user.findMany({ where: { role: 'administrator', is_active: true } });
    for (const admin of admins) {
      await this.notifications.create({
        user_id: admin.id,
        title: '📝 Nouvelle pré-inscription',
        message: `${dto.child_full_name} — Demande de pré-inscription reçue`,
        type: 'pre_inscription',
        link: '/list/pre-inscriptions',
      });
    }

    return reg;
  }

  async findAll(status?: string) {
    return this.prisma.preRegistration.findMany({
      where: status ? { status } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  async approve(id: string, adminName: string) {
    return this.prisma.preRegistration.update({
      where: { id },
      data: { status: 'approved', processed_at: new Date(), processed_by: adminName },
    });
  }

  async reject(id: string, adminName: string, reason: string) {
    return this.prisma.preRegistration.update({
      where: { id },
      data: { status: 'rejected', processed_at: new Date(), processed_by: adminName, rejection_reason: reason },
    });
  }

  async remove(id: string) {
    return this.prisma.preRegistration.delete({ where: { id } });
  }

  async stats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.preRegistration.count(),
      this.prisma.preRegistration.count({ where: { status: 'pending' } }),
      this.prisma.preRegistration.count({ where: { status: 'approved' } }),
      this.prisma.preRegistration.count({ where: { status: 'rejected' } }),
    ]);
    return { total, pending, approved, rejected };
  }
}
