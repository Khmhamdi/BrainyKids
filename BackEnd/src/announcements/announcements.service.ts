import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}
  // Utilise la table Event pour les annonces (même structure)
  async findAll() {
    return this.prisma.event.findMany({ orderBy: { event_date: 'desc' }, take: 20 });
  }
  async create(dto: any) {
    return this.prisma.event.create({ data: {
      name: dto.title || dto.name, description: dto.description,
      event_date: new Date(dto.date || Date.now()), location: dto.location || 'Brainy Kids',
      registration_fee: 0,
    }});
  }
  async remove(id: string) { return this.prisma.event.delete({ where: { id } }); }
}
