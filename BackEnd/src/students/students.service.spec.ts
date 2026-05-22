import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotFoundException } from '@nestjs/common';

const mockNotifications = {
  create: jest.fn(),
  upsertByLink: jest.fn(),
};

const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

const mockPrisma = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  payment:              { findMany: jest.fn(), updateMany: jest.fn(), aggregate: jest.fn(), deleteMany },
  notification:         { deleteMany },
  user:                 { findMany: jest.fn() },
  absence:              { findMany: jest.fn(), deleteMany },
  studentParent:        { deleteMany, create: jest.fn(), count: jest.fn() },
  clubMembership:       { deleteMany },
  eventRegistration:    { deleteMany },
  evaluation:           { deleteMany },
  healthTracking:       { deleteMany },
  specializedFollowUp:  { deleteMany, create: jest.fn() },
  medicalFile:          { deleteMany, create: jest.fn(), update: jest.fn() },
  registrationChecklist:{ deleteMany, create: jest.fn(), upsert: jest.fn() },
  studentPack:          { create: jest.fn(), upsert: jest.fn() },
  $transaction: jest.fn().mockResolvedValue([]),
};

describe('StudentsService', () => {
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();
    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();

    // Valeurs par défaut pour findOne : aucun paiement en retard
    mockPrisma.payment.findMany.mockResolvedValue([]);
    mockPrisma.payment.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 0 }, _count: 0 });
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.$transaction.mockResolvedValue([]);
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

    it("doit retourner l'enfant si trouvé", async () => {
      const mockStudent = { id: '1', full_name: 'Yasmine Triki', class: {}, student_parents: [] };
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      const result = await service.findOne('1');
      expect(result.full_name).toBe('Yasmine Triki');
    });

    it('doit créer une notification admin si des paiements passent en retard', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([{ id: 'p1' }]);
      mockPrisma.payment.aggregate.mockResolvedValue({ _sum: { amount: 450 }, _count: 1 });
      mockPrisma.student.findUnique
        .mockResolvedValueOnce({ full_name: 'Sami Kh', student_parents: [] })
        .mockResolvedValue({ id: '1', full_name: 'Sami Kh', student_parents: [] });
      mockPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

      await service.findOne('1');

      expect(mockNotifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'overdue', message: expect.stringContaining('450') }),
      );
    });
  });

  describe('create()', () => {
    it('doit créer un enfant avec les bonnes données', async () => {
      const dto = { full_name: 'Nouvel Enfant', date_of_birth: '2020-01-01', class_id: 'cls-1', grade: 'PS' };
      // findMany pour génération du numéro d'inscription
      mockPrisma.student.findMany.mockResolvedValue([]);
      mockPrisma.student.create.mockResolvedValue({ id: 'new-id', ...dto });

      const result = await service.create(dto);
      expect(mockPrisma.student.create).toHaveBeenCalled();
      expect(result.full_name).toBe('Nouvel Enfant');
    });
  });

  describe('remove()', () => {
    it('doit supprimer un enfant existant', async () => {
      const mockStudent = { id: '1', full_name: 'Test', student_parents: [] };
      mockPrisma.student.findUnique.mockResolvedValue(mockStudent);
      mockPrisma.student.delete.mockResolvedValue({ id: '1' });

      await service.remove('1');
      expect(mockPrisma.student.delete).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });
});
