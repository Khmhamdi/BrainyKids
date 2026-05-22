import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findAll(page = 1, limit = 10, search = '', includeArchived = false, classId?: string, schoolYear?: string) {
    const skip = (page - 1) * limit;
    // schoolYear filter: uses student_pack.school_year (most accurate)
    const where: any = {
      archived: includeArchived ? true : false,
      ...(schoolYear && { student_pack: { school_year: schoolYear } }),
      ...(search     && { full_name: { contains: search, mode: 'insensitive' as const } }),
      ...(classId    && { class_id: classId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where, skip, take: limit,
        include: {
          class: { include: { teacher: { include: { user: true } } } },
          student_parents: { include: { parent: { include: { user: true } } } },
          absences: { orderBy: { date: 'desc' }, take: 5 },
          payments: { orderBy: { due_date: 'desc' }, take: 3 },
          registration_checklist: true,
          specialized_followup: true,
          student_pack: true,
        },
        orderBy: { full_name: 'asc' },
      }),
      this.prisma.student.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    // Transition pending → overdue
    const newlyOverdue = await this.prisma.payment.findMany({
      where: { student_id: id, status: 'pending', due_date: { lt: new Date() } },
    });
    if (newlyOverdue.length > 0) {
      await this.prisma.payment.updateMany({
        where: { id: { in: newlyOverdue.map(p => p.id) } },
        data: { status: 'overdue' },
      });
    }
    // Une notif par élève avec le total global en retard
    const allOverdue = await this.prisma.payment.aggregate({
      where: { student_id: id, status: 'overdue' },
      _sum: { amount: true },
      _count: true,
    });
    if ((allOverdue._count ?? 0) > 0) {
      const total = allOverdue._sum.amount ?? 0;
      const link  = `/list/students/${id}`;
      const student = await this.prisma.student.findUnique({
        where: { id },
        select: {
          full_name: true,
          student_parents: { include: { parent: { select: { user_id: true } } } },
        },
      });
      const name = student?.full_name || '';
      const admins = await this.prisma.user.findMany({ where: { role: 'administrator' }, select: { id: true } });
      for (const admin of admins) {
        await this.prisma.notification.deleteMany({ where: { user_id: admin.id, type: 'overdue', link } });
        await this.notifications.create({
          user_id: admin.id, type: 'overdue', link,
          title: '⚠️ Paiement en retard',
          message: `${name} — Paiement(s) en retard : ${total} DT`,
        });
      }
      for (const sp of student?.student_parents || []) {
        if (sp.parent?.user_id) {
          await this.prisma.notification.deleteMany({ where: { user_id: sp.parent.user_id, type: 'overdue', link } });
          await this.notifications.create({
            user_id: sp.parent.user_id, type: 'overdue', link,
            title: '⚠️ Paiement en retard',
            message: `Paiement(s) en retard : ${total} DT`,
          });
        }
      }
    }
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: { include: { teacher: { include: { user: true } }, schedule: true } },
        student_parents: { include: { parent: { include: { user: true } } } },
        absences: { orderBy: { date: 'desc' } },
        payments: { orderBy: { due_date: 'desc' } },
        medical_file: true,
        registration_checklist: true,
        health_tracking: { orderBy: { date: 'desc' }, take: 10 },
        club_memberships: { include: { club: true } },
        evaluations: { include: { criteria: true }, orderBy: { date: 'desc' } },
        schedule: true,
        specialized_followup: true,
        notes: { orderBy: { date: 'desc' } },
      },
    });
    if (!student) throw new NotFoundException(`Enfant #${id} introuvable`);
    return student;
  }

  async create(dto: any) {
    if (!dto.class_id) throw new BadRequestException('La classe est obligatoire');

    // Auto-generate numero_inscription: format {startYear}-{NNN}
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    const prefix = `${startYear}-`;
    const existingNums = await this.prisma.student.findMany({
      where: { numero_inscription: { startsWith: prefix } },
      select: { numero_inscription: true },
    });
    let maxNum = 0;
    for (const s of existingNums) {
      const n = parseInt(s.numero_inscription!.slice(prefix.length)) || 0;
      if (n > maxNum) maxNum = n;
    }
    const numero_inscription = `${prefix}${String(maxNum + 1).padStart(3, '0')}`;

    const student = await this.prisma.student.create({
      data: {
        full_name:          dto.full_name,
        date_of_birth:      new Date(dto.date_of_birth),
        class_id:           dto.class_id,
        grade:              dto.grade || '',
        gender:             dto.gender || 'M',
        regime:             dto.regime || 'journee_complete',
        registration_date:  new Date(),
        lieu_naissance:     dto.lieu_naissance  || null,
        nationalite:        dto.nationalite     || 'Tunisienne',
        numero_inscription,
        heure_arrivee:      dto.heure_arrivee   || null,
        heure_depart:       dto.heure_depart    || null,
        transport_mode:     dto.transport_mode  || 'parent',
        ...(dto.schedule_id && { schedule_id: dto.schedule_id }),
        ...(dto.photo_url   && { photo_url: dto.photo_url }),
      },
    });
    // Lier le père si fourni
    if (dto.father_id) {
      await this.prisma.studentParent.create({
        data: { student_id: student.id, parent_id: dto.father_id, relationship: 'father' },
      });
    }
    // Lier la mère si fournie
    if (dto.mother_id) {
      await this.prisma.studentParent.create({
        data: { student_id: student.id, parent_id: dto.mother_id, relationship: 'mother' },
      });
    }
    // Rétrocompatibilité avec parent_id générique
    if (dto.parent_id && !dto.father_id && !dto.mother_id) {
      await this.prisma.studentParent.create({
        data: { student_id: student.id, parent_id: dto.parent_id, relationship: dto.relationship || 'parent' },
      });
    }
    // Créer le dossier médical
    if (dto.medical_file !== undefined) {
      const mf = dto.medical_file;
      await this.prisma.medicalFile.create({
        data: {
          student_id:             student.id,
          allergies:              '',
          chronic_conditions:     '',
          vaccinations:           '',
          emergency_contact:      '',
          has_allergies:          mf.has_allergies          ?? false,
          allergies_detail:       mf.allergies_detail       ?? null,
          traitement:             mf.traitement             ?? false,
          traitement_detail:      mf.traitement_detail      ?? null,
          condition_particuliere: mf.condition_particuliere ?? null,
          medecin_traitant:       mf.medecin_traitant       ?? null,
          tel_medecin:            mf.tel_medecin            ?? null,
          email_medecin:          mf.email_medecin          ?? null,
          last_update: new Date(),
        },
      });
    }
    // Créer la checklist d'inscription
    await this.prisma.registrationChecklist.create({
      data: {
        student_id:                 student.id,
        photo_identite:             dto.photo_identite             || false,
        extrait_naissance:          dto.extrait_naissance          || false,
        certificat_medical:         dto.certificat_medical         || false,
        fiche_renseignement_signee: dto.fiche_renseignement_signee || false,
        vaccinations_a_jour:        dto.vaccinations_a_jour        || false,
        copie_cin_pere:             dto.copie_cin_pere             || false,
        copie_cin_mere:             dto.copie_cin_mere             || false,
        completed: false,
        last_update: new Date(),
      },
    });
    // Créer le suivi spécialisé si fourni
    if (dto.followup_type && dto.followup_specialist_name) {
      await this.prisma.specializedFollowUp.create({
        data: {
          student_id: student.id,
          type: dto.followup_type,
          specialist_name: dto.followup_specialist_name,
          specialist_phone: dto.followup_specialist_phone || null,
          specialist_email: dto.followup_specialist_email || null,
          frequency: dto.followup_frequency || null,
          class_recommendations: dto.followup_class_recommendations || null,
          notes: dto.followup_notes || null,
        },
      });
    }
    // Créer le pack de l'année scolaire
    const schoolYearLabel = dto.school_year || (startYear + '-' + (startYear + 1));
    await this.prisma.studentPack.create({
      data: {
        student_id:  student.id,
        school_year: schoolYearLabel,
        regime:      dto.regime || 'journee_complete',
      },
    });
    return student;
  }

  async update(id: string, dto: any) {
    await this.findOne(id);

    // Mettre à jour l'élève
    await this.prisma.student.update({
      where: { id },
      data: {
        ...(dto.full_name          && { full_name: dto.full_name }),
        ...(dto.date_of_birth      && { date_of_birth: new Date(dto.date_of_birth) }),
        ...(dto.class_id           && { class: { connect: { id: dto.class_id } } }),
        ...(dto.grade              && { grade: dto.grade }),
        ...(dto.gender             && { gender: dto.gender }),
        ...(dto.regime             && { regime: dto.regime }),
        ...(dto.schedule_id !== undefined && {
          schedule: dto.schedule_id ? { connect: { id: dto.schedule_id } } : { disconnect: true },
        }),
        ...(dto.photo_url !== undefined && { photo_url: dto.photo_url }),
        lieu_naissance:     dto.lieu_naissance     !== undefined ? (dto.lieu_naissance || null) : undefined,
        nationalite:        dto.nationalite        !== undefined ? (dto.nationalite || 'Tunisienne') : undefined,
        numero_inscription: dto.numero_inscription !== undefined ? (dto.numero_inscription || null) : undefined,
        heure_arrivee:      dto.heure_arrivee      !== undefined ? (dto.heure_arrivee || null) : undefined,
        heure_depart:       dto.heure_depart       !== undefined ? (dto.heure_depart || null) : undefined,
        transport_mode:     dto.transport_mode     !== undefined ? (dto.transport_mode || 'parent') : undefined,
      },
    });

    // Mettre à jour / créer le dossier médical
    if (dto.medical_file !== undefined) {
      const mf = dto.medical_file;
      await this.prisma.medicalFile.upsert({
        where:  { student_id: id },
        update: {
          has_allergies:          mf.has_allergies          ?? false,
          allergies_detail:       mf.allergies_detail       ?? null,
          traitement:             mf.traitement             ?? false,
          traitement_detail:      mf.traitement_detail      ?? null,
          condition_particuliere: mf.condition_particuliere ?? null,
          medecin_traitant:       mf.medecin_traitant       ?? null,
          tel_medecin:            mf.tel_medecin            ?? null,
          email_medecin:          mf.email_medecin          ?? null,
          last_update: new Date(),
        },
        create: {
          student_id:             id,
          allergies:              '',
          chronic_conditions:     '',
          vaccinations:           '',
          emergency_contact:      '',
          has_allergies:          mf.has_allergies          ?? false,
          allergies_detail:       mf.allergies_detail       ?? null,
          traitement:             mf.traitement             ?? false,
          traitement_detail:      mf.traitement_detail      ?? null,
          condition_particuliere: mf.condition_particuliere ?? null,
          medecin_traitant:       mf.medecin_traitant       ?? null,
          tel_medecin:            mf.tel_medecin            ?? null,
          email_medecin:          mf.email_medecin          ?? null,
          last_update: new Date(),
        },
      });
    }

    // Mettre à jour la checklist (champs à plat OU imbriqués)
    const checklist = dto.checklist || {
      photo_identite:             dto.photo_identite             ?? false,
      extrait_naissance:          dto.extrait_naissance          ?? false,
      certificat_medical:         dto.certificat_medical         ?? false,
      fiche_renseignement_signee: dto.fiche_renseignement_signee ?? false,
      vaccinations_a_jour:        dto.vaccinations_a_jour        ?? false,
      copie_cin_pere:             dto.copie_cin_pere             ?? false,
      copie_cin_mere:             dto.copie_cin_mere             ?? false,
    };

    const allDone = Object.values(checklist).every(Boolean);
    await this.prisma.registrationChecklist.upsert({
      where:  { student_id: id },
      update: { ...checklist, completed: allDone, last_update: new Date() },
      create: { student_id: id, ...checklist, completed: allDone, last_update: new Date() },
    });

    // Mettre à jour l'année scolaire du pack
    if (dto.school_year) {
      await this.prisma.studentPack.upsert({
        where:  { student_id: id },
        update: { school_year: dto.school_year },
        create: { student_id: id, school_year: dto.school_year, regime: dto.regime || 'journee_complete' },
      });
    }

    // Mettre à jour le suivi spécialisé
    if (dto.followup_type !== undefined) {
      if (dto.followup_type === '' || dto.followup_type === null) {
        // Supprimer le suivi si le type est vidé
        await this.prisma.specializedFollowUp.deleteMany({ where: { student_id: id } });
      } else if (dto.followup_specialist_name) {
        await this.prisma.specializedFollowUp.upsert({
          where: { student_id: id },
          update: {
            type: dto.followup_type,
            specialist_name: dto.followup_specialist_name,
            specialist_phone: dto.followup_specialist_phone || null,
            specialist_email: dto.followup_specialist_email || null,
            frequency: dto.followup_frequency || null,
            class_recommendations: dto.followup_class_recommendations || null,
            notes: dto.followup_notes || null,
          },
          create: {
            student_id: id,
            type: dto.followup_type,
            specialist_name: dto.followup_specialist_name,
            specialist_phone: dto.followup_specialist_phone || null,
            specialist_email: dto.followup_specialist_email || null,
            frequency: dto.followup_frequency || null,
            class_recommendations: dto.followup_class_recommendations || null,
            notes: dto.followup_notes || null,
          },
        });
      }
    }

    // Mettre à jour les liens père/mère
    if (dto.father_id !== undefined) {
      await this.prisma.studentParent.deleteMany({
        where: { student_id: id, relationship: 'father' },
      });
      if (dto.father_id) {
        await this.prisma.studentParent.create({
          data: { student_id: id, parent_id: dto.father_id, relationship: 'father' },
        });
      }
    }
    if (dto.mother_id !== undefined) {
      await this.prisma.studentParent.deleteMany({
        where: { student_id: id, relationship: 'mother' },
      });
      if (dto.mother_id) {
        await this.prisma.studentParent.create({
          data: { student_id: id, parent_id: dto.mother_id, relationship: 'mother' },
        });
      }
    }

    return this.findOne(id);
  }

  // ── ARCHIVAGE ──────────────────────────────────────────────
  async archive(id: string, archivedBy: string) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: { archived: true, archived_at: new Date(), archived_by: archivedBy },
    });
  }

  async restore(id: string) {
    return this.prisma.student.update({
      where: { id },
      data: { archived: false, archived_at: null, archived_by: null },
    });
  }

  // ── SUPPRESSION DÉFINITIVE ─────────────────────────────────
  async unregister(id: string, reason: string) {
    await this.findOne(id);
    return this.prisma.student.update({
      where: { id },
      data: {
        unregistered_at: new Date(),
        unregistered_reason: reason,
        archived: true,
        archived_at: new Date(),
        archived_by: 'system',
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.studentParent.deleteMany({ where: { student_id: id } }),
      this.prisma.absence.deleteMany({ where: { student_id: id } }),
      this.prisma.payment.deleteMany({ where: { student_id: id } }),
      this.prisma.clubMembership.deleteMany({ where: { student_id: id } }),
      this.prisma.eventRegistration.deleteMany({ where: { student_id: id } }),
      this.prisma.evaluation.deleteMany({ where: { student_id: id } }),
      this.prisma.healthTracking.deleteMany({ where: { student_id: id } }),
    ]);
    await this.prisma.specializedFollowUp.deleteMany({ where: { student_id: id } });
    await this.prisma.medicalFile.deleteMany({ where: { student_id: id } });
    await this.prisma.registrationChecklist.deleteMany({ where: { student_id: id } });
    return this.prisma.student.delete({ where: { id } });
  }

  // ── LIAISON PARENT ─────────────────────────────────────────
  async linkParent(studentId: string, parentId: string, relationship: string) {
    const existing = await this.prisma.studentParent.count({ where: { student_id: studentId } });
    if (existing >= 2) throw new ForbiddenException('Maximum 2 parents par enfant');
    return this.prisma.studentParent.create({
      data: { student_id: studentId, parent_id: parentId, relationship },
    });
  }

  async unlinkParent(studentId: string, parentId: string) {
    return this.prisma.studentParent.deleteMany({
      where: { student_id: studentId, parent_id: parentId },
    });
  }
}
