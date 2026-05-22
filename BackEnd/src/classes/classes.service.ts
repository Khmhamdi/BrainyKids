import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.class.findMany({
      include: { teacher: { include: { user: true } }, students: true, schedule: true },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.class.findUnique({
      where: { id },
      include: { teacher: { include: { user: true } }, students: true, schedule: true },
    });
    if (!c) throw new NotFoundException('Classe introuvable');
    return c;
  }

  async create(dto: any) {
    return this.prisma.class.create({
      data: { name: dto.name, teacher_id: dto.teacher_id, age_group: dto.age_group, room_number: dto.room_number },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    const { schedule_id, ...rest } = dto;
    return this.prisma.class.update({
      where: { id },
      data: {
        ...rest,
        ...(schedule_id !== undefined && {
          schedule: schedule_id ? { connect: { id: schedule_id } } : { disconnect: true },
        }),
      },
      include: { teacher: { include: { user: true } }, students: true, schedule: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.class.delete({ where: { id } });
  }
}
