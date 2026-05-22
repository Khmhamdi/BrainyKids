import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async markPendingAsOverdue(studentId?: string) {
    await this.prisma.payment.updateMany({
      where: {
        status: 'pending',
        due_date: { lt: new Date() },
        ...(studentId && { student_id: studentId }),
      },
      data: { status: 'overdue' },
    });
  }

  async findAll(page = 1, limit = 20, status?: string) {
    await this.markPendingAsOverdue();
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({ where, skip, take: limit, include: { student: true, parent: true }, orderBy: { due_date: 'desc' } }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }
  async findByStudent(studentId: string) {
    await this.markPendingAsOverdue(studentId);
    return this.prisma.payment.findMany({ where: { student_id: studentId }, orderBy: { due_date: 'desc' } });
  }
  async create(dto: any) {
    return this.prisma.payment.create({ data: {
      student_id: dto.student_id, parent_id: dto.parent_id, type: dto.type,
      amount: dto.amount, due_date: new Date(dto.due_date), paid_date: dto.paid_date ? new Date(dto.paid_date) : new Date(),
      status: dto.status || 'pending', description: dto.description || '',
    }});
  }
  async updateStatus(id: string, status: string) {
    return this.prisma.payment.update({ where: { id }, data: { status, ...(status === 'paid' && { paid_date: new Date() }) } });
  }
  async getTreasuryStats() {
    await this.markPendingAsOverdue();
    const payments = await this.prisma.payment.findMany();
    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const pendingAmount = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const overdueCount = payments.filter(p => p.status === 'overdue').length;
    return { totalRevenue, pendingAmount, overdueCount, totalPayments: payments.length };
  }
}
