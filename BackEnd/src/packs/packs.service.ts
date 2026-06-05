import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const MONTHS_LABELS: Record<number, string> = {
  9:'Sept', 10:'Oct', 11:'Nov', 12:'Déc',
  1:'Jan', 2:'Fév', 3:'Mar', 4:'Avr', 5:'Mai', 6:'Juin'
};
// Année scolaire : Sept → Juin (10 mois)
const SCHOOL_MONTHS = [9,10,11,12,1,2,3,4,5,6];

@Injectable()
export class PacksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ── Calcul tarif selon régime ────────────────────────────────
  private calcTarif(tarif_base: number, regime: string): number {
    if (regime === 'journee_complete') return tarif_base;
    return Math.round(tarif_base / 2 + 10);
  }

  // ── Créer ou mettre à jour le pack + générer les paiements ──
  async upsertPack(studentId: string, dto: any) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: { student_parents: { include: { parent: true } }, payments: true },
    });
    if (!student) throw new Error('Enfant introuvable');

    const parent = student.student_parents?.[0]?.parent;
    const schoolYear = dto.school_year || this.currentSchoolYear();
    const startMonth = parseInt(dto.start_month) || 9;
    const endMonth = parseInt(dto.end_month) || 6;
    const regime = dto.regime || 'journee_complete';
    const tarif_base = parseFloat(dto.tarif_base || dto.scolarite_amount) || 0;
    const scolarite_amount = this.calcTarif(tarif_base, regime);

    // Convertir tous les montants en Float dès réception
    const cantineAmount     = parseFloat(dto.cantine_amount)     || 0;
    const transportAmount   = parseFloat(dto.transport_amount)   || 0;
    const inscriptionAmount = parseFloat(dto.inscription_amount) || 0;
    const discountAmount    = parseFloat(dto.discount)           || 0;
    const clubs = (dto.clubs || []).map((c: any) => ({
      name: c.name,
      amount: parseFloat(c.amount) || 0,
    }));

    // Upsert le pack
    await this.prisma.studentPack.upsert({
      where: { student_id: studentId },
      update: { ...this.packData(dto, schoolYear, startMonth, endMonth, regime, tarif_base, scolarite_amount) },
      create: { student_id: studentId, ...this.packData(dto, schoolYear, startMonth, endMonth, regime, tarif_base, scolarite_amount) },
    });

    // Mettre à jour le régime sur Student
    await this.prisma.student.update({
      where: { id: studentId },
      data: { regime },
    });

    // Supprimer les anciens paiements non payés
    await this.prisma.payment.deleteMany({
      where: { student_id: studentId, status: { not: 'paid' } },
    });

    const payments: any[] = [];
    const activeMonths = SCHOOL_MONTHS.filter(m => {
      const mIdx = SCHOOL_MONTHS.indexOf(m);
      const sIdx = SCHOOL_MONTHS.indexOf(startMonth);
      const eIdx = SCHOOL_MONTHS.indexOf(endMonth);
      return mIdx >= sIdx && mIdx <= eIdx;
    });

    // Frais d'inscription
    if (inscriptionAmount > 0 && !dto.inscription_paid) {
      const year = startMonth >= 9 ? +schoolYear.split('-')[0] : +schoolYear.split('-')[1];
      payments.push({
        student_id: studentId, parent_id: parent?.id || null,
        type: 'inscription', amount: inscriptionAmount,
        due_date: new Date(year, startMonth - 1, 5), status: 'pending',
        description: `Frais d'inscription ${schoolYear}`, month: startMonth, year,
      });
    }

    // Paiements mensuels
    for (const month of activeMonths) {
      const year = month >= 9 ? +schoolYear.split('-')[0] : +schoolYear.split('-')[1];
      const dueDate = new Date(year, month - 1, 5);
      const label = MONTHS_LABELS[month];
      const isFirst = activeMonths.indexOf(month) === 0;
      const discount = isFirst ? discountAmount : 0;

      // Scolarité
      if (scolarite_amount > 0) {
        payments.push({
          student_id: studentId, parent_id: parent?.id || null,
          type: 'scolarite', amount: scolarite_amount - discount,
          due_date: dueDate, status: 'pending',
          description: `Scolarité ${label} ${year} (${regime === 'journee_complete' ? 'Journée complète' : regime === 'demi_matin' ? 'Demi-journée matin' : 'Demi-journée après-midi'})`,
          month, year,
        });
      }
      // Cantine
      if (dto.cantine_enabled && cantineAmount > 0) {
        payments.push({
          student_id: studentId, parent_id: parent?.id || null,
          type: 'cantine', amount: cantineAmount,
          due_date: dueDate, status: 'pending',
          description: `Cantine ${label} ${year}`, month, year,
        });
      }
      // Transport
      if (dto.transport_enabled && transportAmount > 0) {
        payments.push({
          student_id: studentId, parent_id: parent?.id || null,
          type: 'transport', amount: transportAmount,
          due_date: dueDate, status: 'pending',
          description: `Transport ${label} ${year}`, month, year,
        });
      }
      // Clubs optionnels
      for (const club of clubs) {
        if (club.amount > 0) {
          payments.push({
            student_id: studentId, parent_id: parent?.id || null,
            type: `club_${club.name.toLowerCase().replace(/\s+/g, '_')}`,
            amount: club.amount, due_date: dueDate, status: 'pending',
            description: `Club ${club.name} ${label} ${year}`, month, year,
          });
        }
      }
    }

    await this.prisma.payment.createMany({ data: payments });

    if (parent?.user_id) {
      await this.notifications.create({
        user_id: parent.user_id,
        title: 'Pack financier configuré',
        message: `Le pack de ${student.full_name} pour ${schoolYear} a été configuré. ${payments.length} échéances générées.`,
        type: 'pack',
      });
    }

    return { paymentsGenerated: payments.length, months: activeMonths.length, regime, scolarite_amount };
  }

  async getPack(studentId: string) {
    return this.prisma.studentPack.findUnique({ where: { student_id: studentId } });
  }

  // ── Marquer tous les paiements d'un mois comme payés (un clic) ──
  async markMonthPaid(studentId: string, month: number, year: number) {
    const payments = await this.prisma.payment.findMany({
      where: { student_id: studentId, month, year, status: { not: 'paid' } },
    });
    await this.prisma.payment.updateMany({
      where: { student_id: studentId, month, year, status: { not: 'paid' } },
      data: { status: 'paid', paid_date: new Date() },
    });
    return { marked: payments.length, month: MONTHS_LABELS[month] || month, year };
  }

  // ── Marquer un seul paiement comme payé ──────────────────────
  async markPaid(paymentId: string) {
    return this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'paid', paid_date: new Date() },
    });
  }

  // ── Paiements par élève groupés par mois ─────────────────────
  async getPaymentsByStudent(studentId: string) {
    await this.prisma.payment.updateMany({
      where: { student_id: studentId, status: 'pending', due_date: { lt: new Date() } },
      data:  { status: 'overdue' },
    });
    const payments = await this.prisma.payment.findMany({
      where: { student_id: studentId },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    });
    // Grouper par mois
    const grouped: Record<string, any> = {};
    for (const p of payments) {
      const key = `${p.year}-${p.month}`;
      if (!grouped[key]) {
        grouped[key] = {
          month: p.month, year: p.year,
          label: `${MONTHS_LABELS[p.month] || p.month} ${p.year}`,
          payments: [], total: 0, totalPaid: 0, allPaid: false,
        };
      }
      grouped[key].payments.push(p);
      grouped[key].total += p.amount;
      if (p.status === 'paid') grouped[key].totalPaid += p.amount;
    }
    // Calculer allPaid
    for (const g of Object.values(grouped)) {
      g.allPaid = g.payments.every((p: any) => p.status === 'paid');
    }
    return Object.values(grouped);
  }

  // ── Vérifier les retards + créer les notifications (une par élève) ─
  async checkOverduePayments() {
    // 1. Basculer pending → overdue
    await this.prisma.payment.updateMany({
      where: { status: 'pending', due_date: { lt: new Date() } },
      data:  { status: 'overdue' },
    });

    // 2. Regrouper par élève : total en retard
    const grouped = await this.prisma.payment.groupBy({
      by: ['student_id'],
      where: { status: 'overdue' },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return { processed: 0, upserted: 0 };

    const studentIds = grouped.map(g => g.student_id);
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true, full_name: true,
        student_parents: { include: { parent: { select: { user_id: true } } } },
      },
    });
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));

    const admins = await this.prisma.user.findMany({
      where: { role: 'administrator' },
      select: { id: true },
    });

    let upserted = 0;
    for (const g of grouped) {
      const student = studentMap[g.student_id];
      if (!student) continue;
      const total = g._sum.amount ?? 0;
      const link  = `/list/students/${g.student_id}`;

      for (const admin of admins) {
        // Supprimer toutes les anciennes notifs overdue pour cet élève+admin (même lien)
        await this.prisma.notification.deleteMany({ where: { user_id: admin.id, type: 'overdue', link } });
        await this.notifications.create({
          user_id: admin.id, type: 'overdue', link,
          title: '⚠️ Paiement en retard',
          message: `${student.full_name} — Paiement(s) en retard : ${total} DT`,
        });
        upserted++;
      }
      for (const sp of student.student_parents) {
        if (sp.parent?.user_id) {
          await this.prisma.notification.deleteMany({ where: { user_id: sp.parent.user_id, type: 'overdue', link } });
          await this.notifications.create({
            user_id: sp.parent.user_id, type: 'overdue', link,
            title: '⚠️ Paiement en retard',
            message: `Paiement(s) en retard : ${total} DT`,
          });
          upserted++;
        }
      }
    }

    return { processed: grouped.length, upserted };
  }

  // ── Pack clubs d'été ─────────────────────────────────────────
  async createSummerPack(dto: any) {
    const packAmount  = parseFloat(String(dto.pack_amount  || 0));
    const month       = parseInt(String(dto.month));
    const year        = parseInt(String(dto.year || new Date().getFullYear()));
    // Clubs dynamiques sélectionnés depuis la DB
    const clubsJson: any[] = Array.isArray(dto.clubs_json) ? dto.clubs_json : [];
    const clubsTotal  = clubsJson.reduce((s: number, c: any) => s + parseFloat(String(c.price || 0)), 0);
    const total       = packAmount + clubsTotal;

    const summerPack = await this.prisma.summerPack.create({
      data: {
        student_id:          dto.student_id || null,
        external_student_id: dto.external_student_id || null,
        month,
        year,
        pack_amount:    packAmount,
        clubs_json:     clubsJson,
        langue_fr:      false,
        langue_fr_amount: 0,
        langue_en:      false,
        langue_en_amount: 0,
        robotique:      false,
        robotique_amount: 0,
        total_amount:   total,
        paid:           dto.paid || false,
        paid_date:      dto.paid ? new Date() : null,
      },
    });
    return summerPack;
  }

  // ── Supprimer un paiement (club, cantine, transport seulement) ─
  async deletePayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Paiement introuvable');
    // Interdire la suppression de scolarité et inscription
    if (payment.type === 'scolarite' || payment.type === 'inscription') {
      throw new Error('Ce type de paiement ne peut pas être supprimé');
    }
    return this.prisma.payment.delete({ where: { id: paymentId } });
  }

  async getSummerPacks(month?: number, year?: number) {
    return this.prisma.summerPack.findMany({
      where: { ...(month && { month }), ...(year && { year }) },
      include: {
        student: { select: { id: true, full_name: true, grade: true } },
        external_student: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async markSummerPackPaid(id: string) {
    return this.prisma.summerPack.update({
      where: { id },
      data: { paid: true, paid_date: new Date() },
    });
  }

  async updateSummerPack(id: string, dto: any) {
    const clubsJson = dto.clubs_json || [];
    const packAmount = parseFloat(dto.pack_amount) || 0;
    const clubsTotal = clubsJson.reduce((sum: number, c: any) => sum + (parseFloat(c.price) || 0), 0);
    const total = packAmount + clubsTotal;

    return this.prisma.summerPack.update({
      where: { id },
      data: {
        month:        dto.month,
        year:         dto.year,
        pack_amount:  packAmount,
        clubs_json:   clubsJson,
        total_amount: total,
      },
    });
  }

  // ── Créer un élève externe ───────────────────────────────────
  async createExternalStudent(dto: any) {
    return this.prisma.externalStudent.create({
      data: {
        full_name: dto.full_name,
        date_of_birth: new Date(dto.date_of_birth),
        gender: dto.gender || 'M',
        parent_name: dto.parent_name,
        parent_phone: dto.parent_phone,
        parent_email: dto.parent_email || null,
        address: dto.address || null,
      },
    });
  }

  async getExternalStudents() {
    return this.prisma.externalStudent.findMany({ orderBy: { full_name: 'asc' } });
  }

  // ── Vérifier les dossiers d'inscription incomplets ───────────
  async checkMissingDossiers() {
    const checklists = await this.prisma.registrationChecklist.findMany({
      where: { completed: false, student: { archived: false } },
      include: {
        student: {
          select: {
            id: true,
            full_name: true,
            student_parents: { include: { parent: { select: { user_id: true } } } },
          },
        },
      },
    });

    const admins = await this.prisma.user.findMany({
      where: { role: 'administrator' },
      select: { id: true },
    });

    let upserted = 0;
    for (const cl of checklists) {
      const link = `/list/students/${cl.student.id}`;

      for (const admin of admins) {
        await this.prisma.notification.deleteMany({ where: { user_id: admin.id, type: 'dossier', link } });
        await this.notifications.create({
          user_id: admin.id, type: 'dossier', link,
          title: '📋 Dossier incomplet',
          message: `${cl.student.full_name} — Dossier d'inscription incomplet`,
        });
        upserted++;
      }
      for (const sp of cl.student.student_parents) {
        if (sp.parent?.user_id) {
          await this.prisma.notification.deleteMany({ where: { user_id: sp.parent.user_id, type: 'dossier', link } });
          await this.notifications.create({
            user_id: sp.parent.user_id, type: 'dossier', link,
            title: '📋 Dossier incomplet',
            message: `Dossier d'inscription incomplet`,
          });
          upserted++;
        }
      }
    }

    return { processed: checklists.length, upserted };
  }

  private packData(dto: any, schoolYear: string, startMonth: number, endMonth: number, regime: string, tarif_base: number, scolarite_amount: number) {
    return {
      scolarite_amount:   parseFloat(scolarite_amount as any) || 0,
      tarif_base:         parseFloat(tarif_base as any)        || 0,
      regime,
      cantine_enabled:    dto.cantine_enabled   || false,
      cantine_amount:     parseFloat(dto.cantine_amount)       || 0,
      transport_enabled:  dto.transport_enabled || false,
      transport_amount:   parseFloat(dto.transport_amount)     || 0,
      clubs:              (dto.clubs || []).map((c: any) => ({ name: c.name, amount: parseFloat(c.amount) || 0 })),
      discount:           parseFloat(dto.discount)             || 0,
      inscription_amount: parseFloat(dto.inscription_amount)   || 0,
      inscription_paid:   dto.inscription_paid  || false,
      school_year:        schoolYear,
      start_month:        parseInt(startMonth as any)          || 9,
      end_month:          parseInt(endMonth as any)            || 6,
    };
  }

  private currentSchoolYear(): string {
    const now = new Date();
    const y = now.getFullYear();
    return now.getMonth() >= 8 ? `${y}-${y+1}` : `${y-1}-${y}`;
  }
}
