import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolYearsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.schoolYear.findMany({
      orderBy: { start_date: 'desc' },
    });
  }

  async findCurrent() {
    return this.prisma.schoolYear.findFirst({
      where: { is_current: true },
    });
  }

  async create(data: {
    label: string;
    start_date: string;
    end_date: string;
  }) {
    // Vérifier que le label n'existe pas déjà
    const existing = await this.prisma.schoolYear.findUnique({
      where: { label: data.label },
    });
    if (existing) {
      throw new BadRequestException('Cette année scolaire existe déjà');
    }

    return this.prisma.schoolYear.create({
      data: {
        label: data.label,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_current: false,
        is_active: true,
      },
    });
  }

  async update(id: string, data: {
    label?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
  }) {
    const year = await this.prisma.schoolYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException('Année scolaire introuvable');

    return this.prisma.schoolYear.update({
      where: { id },
      data: {
        ...(data.label && { label: data.label }),
        ...(data.start_date && { start_date: new Date(data.start_date) }),
        ...(data.end_date && { end_date: new Date(data.end_date) }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });
  }

  async setCurrent(id: string) {
    const year = await this.prisma.schoolYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException('Année scolaire introuvable');

    // Démarquer toutes les autres années comme courantes
    await this.prisma.schoolYear.updateMany({
      where: { is_current: true },
      data: { is_current: false },
    });

    // Marquer celle-ci comme courante
    return this.prisma.schoolYear.update({
      where: { id },
      data: { is_current: true },
    });
  }

  async delete(id: string) {
    const year = await this.prisma.schoolYear.findUnique({ where: { id } });
    if (!year) throw new NotFoundException('Année scolaire introuvable');
    if (year.is_current) {
      throw new BadRequestException('Impossible de supprimer l\'année courante');
    }

    return this.prisma.schoolYear.delete({ where: { id } });
  }
}
