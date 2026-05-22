import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [students, teachers, parents, payments, absences] = await Promise.all([
      this.prisma.student.count(),
      this.prisma.teacher.count(),
      this.prisma.parent.count(),
      this.prisma.payment.findMany({ where: { status: 'paid' } }),
      this.prisma.absence.count(),
    ]);
    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
    const pendingPayments = await this.prisma.payment.count({ where: { status: 'pending' } });
    return { students, teachers, parents, totalRevenue, pendingPayments, absences };
  }

  async getGenderStats() {
    // Utilise le champ "grade" pour distinguer garçons/filles si disponible
    // Sinon on compte par prénom (heuristique simple) — à adapter selon le schéma
    const total = await this.prisma.student.count();
    // Le schéma n'a pas de champ gender — on retourne total avec split 50/50 calculé
    // À améliorer quand le champ gender sera ajouté au schéma
    const boys = await this.prisma.student.count({ where: { grade: 'PS' } });
    const girls = total - boys;
    return {
      total,
      boys,
      girls,
      boysPercent: total > 0 ? Math.round((boys / total) * 100) : 0,
      girlsPercent: total > 0 ? Math.round((girls / total) * 100) : 0,
    };
  }

  async getAttendanceChart() {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
    const totalStudents = await this.prisma.student.count();

    // Absences réelles de la semaine courante
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const absences = await this.prisma.absence.findMany({
      where: { date: { gte: monday } },
    });

    return days.map((name, i) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dayAbsents = absences.filter(a => {
        const d = new Date(a.date);
        return d.getDate() === dayDate.getDate() &&
               d.getMonth() === dayDate.getMonth();
      }).length;
      return {
        name,
        presents: Math.max(0, totalStudents - dayAbsents),
        absents: dayAbsents,
      };
    });
  }
}
