import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Identifiants incorrects');
    if (user.is_active === false) throw new UnauthorizedException('Compte désactivé — contactez l\'administration');

    // Vérification mot de passe (bcrypt ou texte brut pour la migration)
    let valid = false;
    if (user.password_hash.startsWith('$2b$')) {
      valid = await bcrypt.compare(password, user.password_hash);
    } else {
      // Mot de passe en clair (seed initial) - à hasher au prochain login
      valid = password === user.password_hash;
      if (valid) {
        const hashed = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { password_hash: hashed },
        });
      }
    }

    if (!valid) throw new UnauthorizedException('Identifiants incorrects');

    // Générer access token (15 min)
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Générer refresh token (7 jours) et stocker en DB
    const refreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 jours

    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes en secondes
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
      },
    };
  }

  async refresh(refreshToken: string) {
    // Vérifier que le refresh token existe et n'est pas révoqué
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!token || token.revoked_at) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Vérifier l'expiration
    if (new Date() > token.expires_at) {
      throw new UnauthorizedException('Refresh token expiré');
    }

    // Révoquer l'ancien token (rotation)
    const newRefreshToken = randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.update({
      where: { id: token.id },
      data: { revoked_at: new Date(), replaced_by: newRefreshToken },
    });

    // Créer le nouveau refresh token
    await this.prisma.refreshToken.create({
      data: {
        user_id: token.user_id,
        token: newRefreshToken,
        expires_at: expiresAt,
      },
    });

    // Générer nouveau access token
    const payload = { sub: token.user.id, username: token.user.username, role: token.user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: 900,
    };
  }

  async logout(refreshToken: string) {
    // Révoquer le refresh token
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked_at: new Date() },
    });
    return { message: 'Déconnexion réussie' };
  }

  async logoutAll(userId: string) {
    // Révoquer tous les refresh tokens de l'utilisateur (logout de tous les devices)
    await this.prisma.refreshToken.updateMany({
      where: { user_id: userId, revoked_at: null },
      data: { revoked_at: new Date() },
    });
    return { message: 'Déconnexion de tous les appareils réussie' };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, full_name: true, role: true, email: true, phone: true, created_at: true },
    });
  }
}
