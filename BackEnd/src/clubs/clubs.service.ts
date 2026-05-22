import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto, UpdateClubDto } from './dto/club.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: string, ageGroup?: string, activeOnly = false) {
    return this.prisma.club.findMany({
      where: {
        ...(type      ? { type }                : {}),
        ...(ageGroup  ? { age_group: ageGroup } : {}),
        ...(activeOnly ? { is_active: true }    : {}),
      },
      include: { _count: { select: { memberships: true } } },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: { memberships: { include: { student: true } } },
    });
    if (!club) throw new NotFoundException('Club introuvable');
    return club;
  }

  create(dto: CreateClubDto) {
    return this.prisma.club.create({ data: dto });
  }

  async update(id: string, dto: UpdateClubDto) {
    await this.findOne(id);
    return this.prisma.club.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.clubMembership.deleteMany({ where: { club_id: id } });
    return this.prisma.club.delete({ where: { id } });
  }
}
