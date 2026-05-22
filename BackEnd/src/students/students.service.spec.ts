import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  absence: { findMany: jest.fn() },
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  describe('findAll()', () => {
    it('doit retourner une liste paginée', async () => {
      const mockStudents = [{ id: '1', full_name: 'Ahmed Ben Ali' }];
      mockPrisma.student.findMany.mockResolvedValue(mockStudents);
      mockPrisma.student.count.mockResolvedValue(1);

      const result = await service.findAll(1, 10, '');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('findOne()', () => {
    it('doit lever NotFoundException si enfant introuvable', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      await expect(service.findOne('inexistant')).rejects.toThrow(NotFoundException);
    });

    it('doit retourner l\'enfant si trouvé', async () => {
      const mockStudent = { id: '1', full_name: 'Yasmine Triki', class: {}, student_parents: [] };
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      const result = await service.findOne('1');
      expect(result.full_name).toBe('Yasmine Triki');
    });
  });

  describe('create()', () => {
    it('doit créer un enfant avec les bonnes données', async () => {
      const dto = { full_name: 'Nouvel Enfant', date_of_birth: '2020-01-01', class_id: 'cls-1', grade: 'PS' };
      mockPrisma.student.create.mockResolvedValue({ id: 'new-id', ...dto });
      const result = await service.create(dto);
      expect(mockPrisma.student.create).toHaveBeenCalled();
      expect(result.full_name).toBe('Nouvel Enfant');
    });
  });

  describe('remove()', () => {
    it('doit supprimer un enfant existant', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: '1', full_name: 'Test' });
      mockPrisma.student.delete.mockResolvedValue({ id: '1' });
      await service.remove('1');
      expect(mockPrisma.student.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
