import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PreRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: any) {
    const reg = await this.prisma.preRegistration.create({
      data: {
        type:             dto.type             ?? 'scolarite',
        child_full_name:  dto.child_full_name,
        date_of_birth:    new Date(dto.date_of_birth),
        gender:           dto.gender           ?? 'M',
        desired_class:    dto.desired_class     ?? '',
        school_year:      dto.school_year       ?? '',
        is_internal:      dto.is_internal       ?? null,
        parent_full_name: dto.parent_full_name,
        parent_phone:     dto.parent_phone,
        parent_email:     dto.parent_email      ?? null,
        parent_cin:       dto.parent_cin        ?? null,
        parent_address:   dto.parent_address    ?? null,
        parent_relation:  dto.parent_relation   ?? 'father',
        message:          dto.message           ?? null,
      },
    });

    // Notifier tous les admins (sans filtre is_active qui n'existe pas)
    const admins = await this.prisma.user.findMany({ where: { role: 'administrator' } });
    const typeLabel = (dto.type ?? 'scolarite') === 'club_ete' ? '☀️ Club d\'été' : '📝 Scolarité';
    for (const admin of admins) {
      await this.notifications.create({
        user_id: admin.id,
        title:   `Nouvelle pré-inscription — ${typeLabel}`,
        message: `${dto.child_full_name} · ${dto.parent_full_name} · ${dto.parent_phone}`,
        type:    'pre_inscription',
        link:    '/list/pre-inscriptions',
      });
    }

    return reg;
  }

  async findAll(status?: string, type?: string) {
    return this.prisma.preRegistration.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(type   && type   !== 'all' ? { type   } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // ── Approbation scolarité : crée l'élève + pack ───────────────
  async approveScolarite(id: string, adminName: string, dto: {
    class_id:       string;
    schedule_id?:   string;
    monthly_fee:    number;
    pack_type:      string;   // mensuel | trimestriel | annuel
    transport_mode: string;
    gender?:        string;
  }) {
    const reg = await this.prisma.preRegistration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException('Pré-inscription introuvable');

    // 1. Créer l'élève
    const student = await this.prisma.student.create({
      data: {
        full_name:      reg.child_full_name,
        date_of_birth:  reg.date_of_birth,
        gender:         dto.gender ?? reg.gender ?? 'M',
        class_id:       dto.class_id,
        transport_mode: dto.transport_mode ?? 'parent',
        school_year:    reg.school_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        archived:       false,
      },
    });

    // 2. Créer le pack financier
    const now = new Date();
    await this.prisma.studentPack.create({
      data: {
        student_id:    student.id,
        school_year:   reg.school_year || `${now.getFullYear()}-${now.getFullYear() + 1}`,
        pack_type:     dto.pack_type,
        monthly_fee:   dto.monthly_fee,
        start_month:   now.getMonth() + 1,
        start_year:    now.getFullYear(),
      },
    });

    // 3. Marquer la pré-inscription comme approuvée
    await this.prisma.preRegistration.update({
      where: { id },
      data: {
        status:       'approved',
        processed_at: new Date(),
        processed_by: adminName,
      },
    });

    return { student_id: student.id };
  }

  // ── Approbation club d'été : marque approuvée uniquement ───────
  async approveClubEte(id: string, adminName: string) {
    return this.prisma.preRegistration.update({
      where: { id },
      data: { status: 'approved', processed_at: new Date(), processed_by: adminName },
    });
  }

  // ── Approbation générique (garde la compatibilité) ─────────────
  async approve(id: string, adminName: string) {
    const reg = await this.prisma.preRegistration.findUnique({ where: { id } });
    if (!reg) throw new NotFoundException();
    if ((reg.type ?? 'scolarite') === 'club_ete') return this.approveClubEte(id, adminName);
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
    const [total, pending, approved, rejected, scolarite, club_ete] = await Promise.all([
      this.prisma.preRegistration.count(),
      this.prisma.preRegistration.count({ where: { status: 'pending' } }),
      this.prisma.preRegistration.count({ where: { status: 'approved' } }),
      this.prisma.preRegistration.count({ where: { status: 'rejected' } }),
      this.prisma.preRegistration.count({ where: { type: 'scolarite' } }),
      this.prisma.preRegistration.count({ where: { type: 'club_ete' } }),
    ]);
    return { total, pending, approved, rejected, scolarite, club_ete };
  }
}
