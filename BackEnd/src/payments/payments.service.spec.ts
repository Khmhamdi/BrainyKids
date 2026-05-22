import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrisma = {
  payment: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('getTreasuryStats()', () => {
    it('doit calculer correctement les statistiques de trésorerie', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([
        { status: 'paid', amount: 500 },
        { status: 'paid', amount: 300 },
        { status: 'pending', amount: 200 },
        { status: 'overdue', amount: 150 },
      ]);

      const stats = await service.getTreasuryStats();
      expect(stats.totalRevenue).toBe(800);
      expect(stats.pendingAmount).toBe(200);
      expect(stats.overdueCount).toBe(1);
      expect(stats.totalPayments).toBe(4);
    });

    it('doit retourner zéro si aucun paiement', async () => {
      mockPrisma.payment.findMany.mockResolvedValue([]);
      const stats = await service.getTreasuryStats();
      expect(stats.totalRevenue).toBe(0);
      expect(stats.pendingAmount).toBe(0);
    });
  });

  describe('updateStatus()', () => {
    it('doit marquer la date de paiement quand status = paid', async () => {
      mockPrisma.payment.update.mockResolvedValue({ id: '1', status: 'paid' });
      await service.updateStatus('1', 'paid');
      expect(mockPrisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'paid', paid_date: expect.any(Date) }),
        }),
      );
    });

    it('ne doit pas modifier paid_date pour status pending', async () => {
      mockPrisma.payment.update.mockResolvedValue({ id: '1', status: 'pending' });
      await service.updateStatus('1', 'pending');
      const callArg = mockPrisma.payment.update.mock.calls[0][0];
      expect(callArg.data).not.toHaveProperty('paid_date');
    });
  });
});
