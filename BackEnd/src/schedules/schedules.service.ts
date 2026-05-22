import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.schedule.findMany({
      include: { classes: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const s = await this.prisma.schedule.findUnique({
      where: { id },
      include: { classes: true },
    });
    if (!s) throw new NotFoundException('Emploi du temps introuvable');
    return s;
  }

  async create(dto: any) {
    return this.prisma.schedule.create({
      data: {
        name:         dto.name,
        description:  dto.description  || '',
        start_time:   dto.start_time,
        end_time:     dto.end_time,
        days_of_week: dto.days_of_week,
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.name         !== undefined && { name:         dto.name }),
        ...(dto.description  !== undefined && { description:  dto.description }),
        ...(dto.start_time   !== undefined && { start_time:   dto.start_time }),
        ...(dto.end_time     !== undefined && { end_time:     dto.end_time }),
        ...(dto.days_of_week !== undefined && { days_of_week: dto.days_of_week }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.schedule.delete({ where: { id } });
  }
}
