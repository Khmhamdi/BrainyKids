import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AbsencesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.absence.findMany({
        skip, take: limit,
        include: { student: { include: { class: true } } },
        orderBy: { date: 'desc' },
      }),
      this.prisma.absence.count(),
    ]);
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByStudent(studentId: string) {
    return this.prisma.absence.findMany({
      where: { student_id: studentId },
      orderBy: { date: 'desc' },
    });
  }

  async findByClassAndDate(classId: string, date: string) {
    const dateOnly = date.split('T')[0];
    const start = new Date(dateOnly + 'T00:00:00.000Z');
    const end   = new Date(dateOnly + 'T23:59:59.999Z');

    const [students, absencesForDay] = await Promise.all([
      this.prisma.student.findMany({
        where: { class_id: classId, archived: false },
        orderBy: { full_name: 'asc' },
      }),
      this.prisma.absence.findMany({
        where: {
          student: { class_id: classId },
          date: { gte: start, lte: end },
        },
      }),
    ]);

    const absenceMap = new Map(absencesForDay.map(a => [a.student_id, a]));
    return students.map(s => ({ ...s, absence: absenceMap.get(s.id) ?? null }));
  }

  async create(dto: any) {
    const absence = await this.prisma.absence.create({
      data: {
        student_id:          dto.student_id,
        date:                new Date(dto.date),
        reason:              dto.reason || '',
        excused:             dto.excused || false,
        medical_certificate: dto.medical_certificate || false,
        apt_to_return:       dto.apt_to_return || false,
        notes:               dto.notes || null,
        recorded_by:         dto.recorded_by || null,
      },
      include: { student: { include: { class: { include: { teacher: { include: { user: true } } } } } } },
    });

    // Notifier l'enseignante de la classe et l'admin
    await this._notifyAbsence(absence).catch(() => {});

    return absence;
  }

  private async _notifyAbsence(absence: any) {
    const student = absence.student;
    if (!student) return;

    const dateStr = new Date(absence.date).toLocaleDateString('fr-FR');
    const title   = `Absence marquée`;
    const message = `${student.full_name} est absent(e) le ${dateStr}`;
    const link    = `/list/students/${student.id}`;

    const recipients: string[] = [];

    // Enseignante de la classe
    const teacherUserId = student.class?.teacher?.user_id;
    if (teacherUserId) recipients.push(teacherUserId);

    // Administrateur(s)
    const admins = await this.prisma.user.findMany({ where: { role: 'administrator' }, select: { id: true } });
    admins.forEach(a => { if (!recipients.includes(a.id)) recipients.push(a.id); });

    await Promise.all(
      recipients.map(uid =>
        this.notifications.upsertByLink({ user_id: uid, title, message, type: 'absence', link })
      )
    );
  }

  async update(id: string, dto: any) {
    return this.prisma.absence.update({
      where: { id },
      data: {
        ...(dto.excused             !== undefined && { excused: dto.excused }),
        ...(dto.medical_certificate !== undefined && { medical_certificate: dto.medical_certificate }),
        ...(dto.apt_to_return       !== undefined && { apt_to_return: dto.apt_to_return }),
        ...(dto.notes               !== undefined && { notes: dto.notes }),
        ...(dto.reason              !== undefined && { reason: dto.reason }),
        ...(dto.recorded_by         !== undefined && { recorded_by: dto.recorded_by }),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.absence.delete({ where: { id } });
  }
}
