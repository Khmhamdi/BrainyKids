import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}
  async findAll() { return this.prisma.event.findMany({ orderBy: { event_date: 'asc' } }); }
  async create(dto: any) {
    return this.prisma.event.create({ data: {
      name: dto.name, description: dto.description || '',
      event_date: new Date(dto.event_date), location: dto.location || '',
      registration_fee: dto.registration_fee || 0,
    }});
  }
  async remove(id: string) { return this.prisma.event.delete({ where: { id } }); }
}
