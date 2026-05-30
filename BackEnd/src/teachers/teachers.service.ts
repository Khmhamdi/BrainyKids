import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, search = '', fonction?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      ...(fonction && { fonction }),
      ...(search && {
        OR: [
          { user: { full_name: { contains: search, mode: 'insensitive' } } },
          { full_name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where, skip, take: limit,
        include: { user: true, classes: true },
        orderBy: { hire_date: 'desc' },
      }),
      this.prisma.teacher.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const t = await this.prisma.teacher.findUnique({
      where: { id },
      include: { user: true, classes: { include: { students: true } }, salary_payments: { orderBy: { year: 'desc' } } },
    });
    if (!t) throw new NotFoundException(`Personnel #${id} introuvable`);
    return t;
  }

  // ── Nom affiché (user.full_name ou full_name direct) ──────────
  getDisplayName(t: any): string {
    return t.user?.full_name || t.full_name || '—';
  }

  async create(dto: any) {
    const isTeacher = !dto.fonction || dto.fonction === 'enseignante';

    if (isTeacher) {
      // Créer le compte utilisateur pour les enseignantes
      const bcrypt = await import('bcrypt');
      const password_hash = await bcrypt.hash(dto.password || 'changeme123', 10);
      const user = await this.prisma.user.create({
        data: {
          username: dto.username,
          password_hash,
          role: 'teacher',
          full_name: dto.full_name,
          email: dto.email || `${dto.username}@brainy-kids.local`,
          phone: dto.phone || null,
        },
      });
      return this.prisma.teacher.create({
        data: {
          user_id: user.id,
          full_name: dto.full_name || null,
          hire_date: new Date(dto.hire_date || Date.now()),
          ...(dto.departure_date && { departure_date: new Date(dto.departure_date) }),
          qualification: dto.qualification || null,
          fonction: 'enseignante',
          ...(dto.photo_url !== undefined && { photo_url: dto.photo_url || null }),
          ...(dto.monthly_salary !== undefined && dto.monthly_salary !== '' && {
            monthly_salary: parseFloat(dto.monthly_salary),
          }),
        },
      });
    } else {
      // Personnel sans compte (femme de service, autre)
      return this.prisma.teacher.create({
        data: {
          full_name: dto.full_name,
          hire_date: new Date(dto.hire_date || Date.now()),
          ...(dto.departure_date && { departure_date: new Date(dto.departure_date) }),
          qualification: dto.qualification || null,
          fonction: dto.fonction,
          ...(dto.photo_url !== undefined && { photo_url: dto.photo_url || null }),
          ...(dto.monthly_salary !== undefined && dto.monthly_salary !== '' && {
            monthly_salary: parseFloat(dto.monthly_salary),
          }),
        },
      });
    }
  }

  async update(id: string, dto: any) {
    const teacher = await this.findOne(id);

    // Si date de départ définie → supprimer les paiements impayés futurs
    if (dto.departure_date) {
      const deptDate  = new Date(dto.departure_date);
      const deptMonth = deptDate.getMonth() + 1;
      const deptYear  = deptDate.getFullYear();
      await this.prisma.staffSalaryPayment.deleteMany({
        where: {
          teacher_id: id,
          paid_at: null,
          OR: [
            { year: { gt: deptYear } },
            { year: deptYear, month: { gt: deptMonth } },
          ],
        },
      });
    }

    // Mettre à jour le compte utilisateur si existant
    if (teacher.user_id && (dto.full_name || dto.email || dto.phone)) {
      await this.prisma.user.update({
        where: { id: teacher.user_id },
        data: {
          ...(dto.full_name && { full_name: dto.full_name }),
          ...(dto.email     && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone || null }),
        },
      });
    }

    return this.prisma.teacher.update({
      where: { id },
      data: {
        ...(dto.full_name      && { full_name: dto.full_name }),
        ...(dto.qualification !== undefined && { qualification: dto.qualification || null }),
        ...(dto.hire_date      && { hire_date: new Date(dto.hire_date) }),
        ...(dto.departure_date !== undefined && {
          departure_date: dto.departure_date ? new Date(dto.departure_date) : null,
        }),
        ...(dto.photo_url !== undefined && { photo_url: dto.photo_url || null }),
        ...(dto.monthly_salary !== undefined && {
          monthly_salary: dto.monthly_salary !== '' && dto.monthly_salary !== null
            ? parseFloat(dto.monthly_salary)
            : null,
        }),
      },
    });
  }

  // ── Pack annuel de salaire ────────────────────────────────────
  async createSalaryPack(teacherId: string, dto: {
    school_year: string;
    monthly_amount: number;
    start_month: number;
    end_month: number;
    notes?: string;
  }) {
    await this.findOne(teacherId);
    const startYear = parseInt(dto.school_year.split('-')[0]);
    if (isNaN(startYear)) throw new Error('Année scolaire invalide');

    // Construire la liste des mois (ex: Sept–Juin → 2 années civiles)
    const months: Array<{ month: number; year: number }> = [];
    if (dto.start_month > dto.end_month) {
      // Chevauchement d'années: Sep(9)→Dec(12) + Jan(1)→Juin(6)
      for (let m = dto.start_month; m <= 12; m++) months.push({ month: m, year: startYear });
      for (let m = 1; m <= dto.end_month; m++)     months.push({ month: m, year: startYear + 1 });
    } else {
      for (let m = dto.start_month; m <= dto.end_month; m++) months.push({ month: m, year: startYear });
    }

    // Supprimer les paiements impayés existants pour ces mois
    await this.prisma.staffSalaryPayment.deleteMany({
      where: {
        teacher_id: teacherId,
        paid_at: null,
        OR: months.map(m => ({ month: m.month, year: m.year })),
      },
    });

    // Créer les paiements mensuels
    await this.prisma.staffSalaryPayment.createMany({
      data: months.map(m => ({
        teacher_id: teacherId,
        month:  m.month,
        year:   m.year,
        amount: parseFloat(String(dto.monthly_amount)),
        notes:  dto.notes || null,
      })),
    });

    return { created: months.length, months };
  }

  async findByUserId(userId: string) {
    return this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: { user: true, classes: true },
    });
  }

  async remove(id: string) {
    const teacher = await this.findOne(id);
    // Supprimer les paiements de salaire liés
    await this.prisma.staffSalaryPayment.deleteMany({ where: { teacher_id: id } });
    await this.prisma.teacher.delete({ where: { id } });
    // Supprimer le compte utilisateur si existant
    if (teacher.user_id) {
      await this.prisma.user.delete({ where: { id: teacher.user_id } });
    }
    return { message: 'Personnel supprimé' };
  }

  // ── Gestion des salaires ──────────────────────────────────────

  async getSalaryPayments(teacherId: string) {
    return this.prisma.staffSalaryPayment.findMany({
      where: { teacher_id: teacherId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async getAllSalaryPayments(filters: {
    month?: string; year?: string; teacherId?: string; status?: string;
  }) {
    const where: any = {};
    if (filters.month)     where.month      = parseInt(filters.month);
    if (filters.year)      where.year       = parseInt(filters.year);
    if (filters.teacherId) where.teacher_id = filters.teacherId;
    if (filters.status === 'paid')    where.paid_at = { not: null };
    if (filters.status === 'pending') where.paid_at = null;

    return this.prisma.staffSalaryPayment.findMany({
      where,
      include: { teacher: { include: { user: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { created_at: 'desc' }],
    });
  }

  async recordSalaryPayment(teacherId: string, dto: any) {
    await this.findOne(teacherId);
    return this.prisma.staffSalaryPayment.create({
      data: {
        teacher_id: teacherId,
        month: parseInt(dto.month),
        year: parseInt(dto.year),
        amount: parseFloat(dto.amount),
        notes: dto.notes || null,
        paid_at: dto.paid_at ? new Date(dto.paid_at) : null,
      },
    });
  }

  async markSalaryPaid(paymentId: string) {
    return this.prisma.staffSalaryPayment.update({
      where: { id: paymentId },
      data: { paid_at: new Date() },
    });
  }

  async deleteSalaryPayment(paymentId: string) {
    return this.prisma.staffSalaryPayment.delete({ where: { id: paymentId } });
  }
}
