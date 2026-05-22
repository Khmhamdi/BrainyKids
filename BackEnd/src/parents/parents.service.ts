import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ParentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 10, search = '', includeArchived = false) {
    const skip = (page - 1) * limit;
    const where: any = {
      archived: includeArchived ? true : false,
      ...(search && { full_name: { contains: search, mode: 'insensitive' as const } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.parent.findMany({
        where, skip, take: limit,
        include: {
          user: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
          student_parents: { include: { student: { include: { class: true } } } },
          payments: { orderBy: { due_date: 'desc' }, take: 5 },
        },
        orderBy: { full_name: 'asc' },
      }),
      this.prisma.parent.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const p = await this.prisma.parent.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
        student_parents: {
          include: {
            student: {
              include: {
                class: { include: { teacher: { include: { user: true } } } },
                absences: { orderBy: { date: 'desc' }, take: 5 },
                payments: { orderBy: { due_date: 'desc' }, take: 5 },
                registration_checklist: true,
              },
            },
          },
        },
        payments: { orderBy: { due_date: 'desc' } },
      },
    });
    if (!p) throw new NotFoundException(`Parent #${id} introuvable`);
    return p;
  }

  async findByUserId(userId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { user_id: userId },
      include: {
        user: { select: { id: true, username: true, full_name: true, email: true, phone: true } },
        student_parents: {
          include: {
            student: {
              include: {
                class: { include: { teacher: { include: { user: true } } } },
                absences: { orderBy: { date: 'desc' }, take: 10 },
                payments: { orderBy: { due_date: 'desc' }, take: 10 },
                registration_checklist: true,
              },
            },
          },
        },
        payments: { orderBy: { due_date: 'desc' } },
      },
    });
    if (!parent) throw new NotFoundException('Profil parent introuvable');
    return parent;
  }

  // ── Lister tous les comptes famille (role=parent) ────────────
  async listFamilyAccounts() {
    return this.prisma.user.findMany({
      where: { role: 'parent' },
      select: { id: true, username: true, full_name: true, email: true, phone: true },
      orderBy: { username: 'asc' },
    });
  }

  // ── Trouver un compte famille par username ─────────────────
  async findFamilyAccount(username: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    return user || null;
  }

  // ── Créer un compte famille (username auto depuis nom de famille) ──
  async createFamilyAccount(familyName: string, email: string, phone?: string) {
    const bcrypt = await import('bcrypt');

    // username: famille.nomdefamille (minuscules, sans espaces)
    const baseUsername = 'famille.' + familyName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retirer accents
      .replace(/\s+/g, '');

    // Vérifier unicité — ajouter suffixe si nécessaire
    let username = baseUsername;
    let suffix = 1;
    while (await this.prisma.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${suffix++}`;
    }

    // Mot de passe temporaire lisible : Famille@1234
    const tempPassword = `Famille@${Math.floor(1000 + Math.random() * 9000)}`;
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Email unique — si déjà utilisé, générer un placeholder
    let userEmail = email;
    const existingEmail = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (existingEmail) {
      userEmail = `${username}@brainy-kids.local`;
    }

    const user = await this.prisma.user.create({
      data: { username, password_hash, role: 'parent', full_name: familyName, email: userEmail, phone },
    });

    return { user, username, tempPassword };
  }

  // ── Créer un parent (père ou mère) ────────────────────────
  async create(dto: any) {
    let userId = dto.user_id;
    let tempPassword: string | null = null;
    let username: string | null = null;

    if (!userId) {
      // Nouveau compte famille
      const familyName = dto.family_name || dto.full_name.split(' ').slice(-1)[0];
      const result = await this.createFamilyAccount(familyName, dto.email, dto.phone);
      userId = result.user.id;
      tempPassword = result.tempPassword;
      username = result.username;
    }

    const parent = await this.prisma.parent.create({
      data: {
        full_name:      dto.full_name,
        gender:         dto.gender || 'father',
        marital_status: dto.marital_status || 'alive',
        family_name:    dto.family_name || null,
        email:      dto.email,
        phone:      dto.phone,
        address:    dto.address    || null,
        cin:        dto.cin        || null,
        profession: dto.profession || null,
        user_id:    userId,
      },
    });

    return { ...parent, tempPassword, username };
  }

  async update(id: string, dto: any) {
    await this.findOne(id);
    return this.prisma.parent.update({
      where: { id },
      data: {
        ...(dto.full_name      !== undefined && { full_name: dto.full_name }),
        ...(dto.gender         !== undefined && { gender: dto.gender }),
        ...(dto.marital_status !== undefined && { marital_status: dto.marital_status }),
        ...(dto.family_name    !== undefined && { family_name: dto.family_name }),
        ...(dto.email          !== undefined && { email: dto.email }),
        ...(dto.phone          !== undefined && { phone: dto.phone }),
        ...(dto.address    !== undefined && { address:    dto.address }),
        ...(dto.cin        !== undefined && { cin:        dto.cin || null }),
        ...(dto.profession !== undefined && { profession: dto.profession || null }),
      },
    });
  }

  // ── ARCHIVAGE ──────────────────────────────────────────────
  async archive(id: string, archivedBy: string) {
    const parent = await this.findOne(id);
    // Archiver le parent
    await this.prisma.parent.update({
      where: { id },
      data: { archived: true, archived_at: new Date(), archived_by: archivedBy },
    });
    // Désactiver le compte utilisateur lié
    if (parent.user_id) {
      await this.prisma.user.update({
        where: { id: parent.user_id },
        data: { is_active: false },
      }).catch(() => {
        // is_active peut ne pas exister — on ignore silencieusement
      });
    }
    return { message: 'Parent archivé et compte désactivé' };
  }

  async restore(id: string) {
    const parent = await this.findOne(id);
    // Restaurer le parent
    await this.prisma.parent.update({
      where: { id },
      data: { archived: false, archived_at: null, archived_by: null },
    });
    // Réactiver le compte utilisateur lié
    if (parent.user_id) {
      await this.prisma.user.update({
        where: { id: parent.user_id },
        data: { is_active: true },
      }).catch(() => {});
    }
    return { message: 'Parent restauré et compte réactivé' };
  }

  // ── SUPPRESSION ────────────────────────────────────────────
  async remove(id: string) {
    const parent = await this.findOne(id);
    await this.prisma.studentParent.deleteMany({ where: { parent_id: id } });
    await this.prisma.payment.deleteMany({ where: { parent_id: id } });
    await this.prisma.parent.delete({ where: { id } });

    // Supprimer le compte User seulement s'il n'a plus aucun parent lié
    const remainingParents = await this.prisma.parent.count({ where: { user_id: parent.user_id } });
    if (remainingParents === 0) {
      await this.prisma.user.delete({ where: { id: parent.user_id } }).catch(() => {});
    }
    return parent;
  }
}
