import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async findByStudent(studentId: string) {
    return this.prisma.studentNote.findMany({
      where: { student_id: studentId },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: any) {
    return this.prisma.studentNote.create({
      data: {
        student_id: dto.student_id,
        content:    dto.content,
        author:     dto.author || null,
        date:       dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.studentNote.update({
      where: { id },
      data: {
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.author  !== undefined && { author:  dto.author }),
        ...(dto.date    !== undefined && { date:    new Date(dto.date) }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.studentNote.delete({ where: { id } });
  }

  private async findOne(id: string) {
    const note = await this.prisma.studentNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException(`Note #${id} introuvable`);
    return note;
  }
}
