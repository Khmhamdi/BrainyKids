import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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

    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        email: user.email,
      },
    };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, full_name: true, role: true, email: true, phone: true, created_at: true },
    });
  }
}
