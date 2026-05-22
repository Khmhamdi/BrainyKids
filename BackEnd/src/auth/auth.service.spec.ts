import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';

// Mock PrismaService
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login()', () => {
    it('doit lever UnauthorizedException si utilisateur inexistant', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login('inconnu', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('doit lever UnauthorizedException si mot de passe incorrect (texte clair)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1', username: 'admin', password_hash: 'bon_mot_de_passe',
        role: 'administrator', full_name: 'Admin', email: 'a@b.com',
      });
      await expect(service.login('admin', 'mauvais_mdp')).rejects.toThrow(UnauthorizedException);
    });

    it('doit retourner un token si identifiants corrects (texte clair)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1', username: 'admin', password_hash: 'admin123',
        role: 'administrator', full_name: 'Admin', email: 'a@b.com',
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.login('admin', 'admin123');
      expect(result).toHaveProperty('access_token', 'mock.jwt.token');
      expect(result.user).toHaveProperty('username', 'admin');
      // Le mot de passe doit être hashé après premier login
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });

  describe('getProfile()', () => {
    it('doit retourner le profil utilisateur sans mot de passe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '1', username: 'admin', full_name: 'Admin Test',
        role: 'administrator', email: 'a@b.com', phone: null, created_at: new Date(),
      });
      const profile = await service.getProfile('1');
      expect(profile).toHaveProperty('username', 'admin');
      expect(profile).not.toHaveProperty('password_hash');
    });
  });
});
