import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLookupDto, UpdateLookupDto } from './dto/lookup.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  findByCategory(category: string, activeOnly = false) {
    return this.prisma.appLookup.findMany({
      where: {
        category,
        ...(activeOnly ? { is_active: true } : {}),
      },
      orderBy: [{ sort_order: 'asc' }, { label: 'asc' }],
    });
  }

  findAllCategories() {
    return this.prisma.appLookup.findMany({
      orderBy: [{ category: 'asc' }, { sort_order: 'asc' }],
    });
  }

  async create(dto: CreateLookupDto) {
    const exists = await this.prisma.appLookup.findUnique({
      where: { category_code: { category: dto.category, code: dto.code } },
    });
    if (exists) throw new ConflictException('Ce code existe déjà dans cette catégorie');
    return this.prisma.appLookup.create({ data: dto });
  }

  async update(id: string, dto: UpdateLookupDto) {
    const item = await this.prisma.appLookup.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Entrée introuvable');
    return this.prisma.appLookup.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const item = await this.prisma.appLookup.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Entrée introuvable');
    return this.prisma.appLookup.delete({ where: { id } });
  }
}
