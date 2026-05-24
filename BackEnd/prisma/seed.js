const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({ where: { username: 'admin' } });
  if (existing) {
    console.log('✅ Seed déjà exécuté — aucune action.');
    return;
  }

  // ── 1. Schedules ────────────────────────────────────────────────
  const schedJournee = await prisma.schedule.create({ data: {
    name: 'Journée Normale', description: 'Pleine journée 08h–16h30',
    start_time: '08:00', end_time: '16:30', days_of_week: 'Lun-Ven',
  }});
  const schedMatin = await prisma.schedule.create({ data: {
    name: 'Demi-journée Matin', description: 'Matin uniquement 08h–12h',
    start_time: '08:00', end_time: '12:00', days_of_week: 'Lun-Ven',
  }});
  const schedApresMidi = await prisma.schedule.create({ data: {
    name: 'Demi-journée Après-midi', description: 'Après-midi uniquement 13h–16h30',
    start_time: '13:00', end_time: '16:30', days_of_week: 'Lun-Ven',
  }});

  // ── 2. Admin users ──────────────────────────────────────────────
  const adminUser = await prisma.user.create({ data: {
    username: 'admin', password_hash: 'Pssword&+23!',
    role: 'administrator', full_name: 'Administrateur Système',
    email: 'admin@brainykids.tn', phone: '20000001',
  }});
  const directriceUser = await prisma.user.create({ data: {
    username: 'directrice', password_hash: 'directrice123',
    role: 'administrator', full_name: 'Mme Samia Belhaj',
    email: 'directrice@brainykids.tn', phone: '20000002',
  }});

  // ── 3. Teachers ─────────────────────────────────────────────────
  const dirTeacher = await prisma.teacher.create({ data: {
    user_id: directriceUser.id, full_name: 'Mme Samia Belhaj',
    hire_date: new Date('2018-09-01'), qualification: 'Master Éducation',
    fonction: 'directrice', monthly_salary: 1000,
  }});

  const ens1User = await prisma.user.create({ data: {
    username: 'enseignante_ps', password_hash: 'ens123',
    role: 'teacher', full_name: 'Mme Haifa Mansouri',
    email: 'haifa.mansouri@brainykids.tn', phone: '20000003',
  }});
  const ens1 = await prisma.teacher.create({ data: {
    user_id: ens1User.id, full_name: 'Mme Haifa Mansouri',
    hire_date: new Date('2020-09-01'), qualification: 'Licence Éducation Préscolaire',
    fonction: 'enseignante', monthly_salary: 600,
  }});

  const ens2User = await prisma.user.create({ data: {
    username: 'enseignante_ms', password_hash: 'ens123',
    role: 'teacher', full_name: 'Mme Imen Trabelsi',
    email: 'imen.trabelsi@brainykids.tn', phone: '20000004',
  }});
  const ens2 = await prisma.teacher.create({ data: {
    user_id: ens2User.id, full_name: 'Mme Imen Trabelsi',
    hire_date: new Date('2021-09-01'), qualification: 'Licence Éducation Préscolaire',
    fonction: 'enseignante', monthly_salary: 600,
  }});

  const ens3User = await prisma.user.create({ data: {
    username: 'enseignante_gs', password_hash: 'ens123',
    role: 'teacher', full_name: 'Mme Sonia Gharbi',
    email: 'sonia.gharbi@brainykids.tn', phone: '20000005',
  }});
  const ens3 = await prisma.teacher.create({ data: {
    user_id: ens3User.id, full_name: 'Mme Sonia Gharbi',
    hire_date: new Date('2019-09-01'), qualification: 'Licence Éducation Préscolaire',
    fonction: 'enseignante', monthly_salary: 600,
  }});

  const fdsUser = await prisma.user.create({ data: {
    username: 'femme_service', password_hash: 'fds123',
    role: 'teacher', full_name: 'Mme Radhia Zouari',
    email: 'radhia.zouari@brainykids.tn', phone: '20000006',
  }});
  const fds = await prisma.teacher.create({ data: {
    user_id: fdsUser.id, full_name: 'Mme Radhia Zouari',
    hire_date: new Date('2020-01-15'), qualification: 'CAP',
    fonction: 'femme_de_service', monthly_salary: 500,
  }});

  // ── 4. Classes ──────────────────────────────────────────────────
  const classPS = await prisma.class.create({ data: {
    name: 'Petite Section — PS', teacher_id: ens1.id,
    age_group: '3', room_number: 'A1', schedule_id: schedJournee.id,
  }});
  const classMS = await prisma.class.create({ data: {
    name: 'Moyenne Section — MS', teacher_id: ens2.id,
    age_group: '4', room_number: 'B1', schedule_id: schedJournee.id,
  }});
  const classGS = await prisma.class.create({ data: {
    name: 'Grande Section — GS', teacher_id: ens3.id,
    age_group: '5', room_number: 'C1', schedule_id: schedJournee.id,
  }});

  // ── 5. Clubs réguliers ──────────────────────────────────────────
  const clubCoran    = await prisma.club.create({ data: { name: 'Coran',             price: 0,   type: 'regulier', age_group: '3-5', is_active: true, description: 'Mémorisation et récitation du Coran' }});
  const clubCalcul   = await prisma.club.create({ data: { name: 'Calcul mental',     price: 35,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Développement des capacités de calcul mental' }});
  const clubFrancais = await prisma.club.create({ data: { name: 'Langue française',  price: 30,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Initiation et renforcement du français' }});
  const clubAnglais  = await prisma.club.create({ data: { name: 'Langue Anglaise',   price: 30,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Initiation à la langue anglaise' }});
  const clubDessin   = await prisma.club.create({ data: { name: 'Dessin',            price: 20,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Arts plastiques et dessin créatif' }});
  const clubSport    = await prisma.club.create({ data: { name: 'Sport',             price: 25,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Activités physiques et sportives' }});
  const clubFete     = await prisma.club.create({ data: { name: "Fête Fin d'année",  price: 30,  type: 'regulier', age_group: '3-5', is_active: true, description: "Préparation du spectacle de fin d'année" }});
  const clubTheatre  = await prisma.club.create({ data: { name: 'Théatre',           price: 20,  type: 'regulier', age_group: '3-5', is_active: true, description: 'Expression dramatique et théatre' }});

  // ── 6. Clubs été ────────────────────────────────────────────────
  const clubJeuxEau   = await prisma.club.create({ data: { name: "Jeux d'eau",   price: 0,   type: 'ete', age_group: '3-5', is_active: true, description: 'Activités aquatiques et jeux d\'eau' }});
  const clubRobotique = await prisma.club.create({ data: { name: 'Robotique',    price: 100, type: 'ete', age_group: '4-5', is_active: true, description: 'Introduction à la robotique et programmation simple' }});
  const clubInfo      = await prisma.club.create({ data: { name: 'Informatique', price: 30,  type: 'ete', age_group: '4-5', is_active: true, description: 'Initiation à l\'informatique et aux outils numériques' }});
  const clubCinema    = await prisma.club.create({ data: { name: 'Cinéma',       price: 0,   type: 'ete', age_group: '3-5', is_active: true, description: 'Projection de films et éveil culturel' }});

  // ── 7. EvaluationCriteria ───────────────────────────────────────
  await prisma.evaluationCriteria.createMany({ data: [
    { age_group: '3', description: 'Communication orale',    max_score: 5 },
    { age_group: '3', description: 'Motricité fine',         max_score: 5 },
    { age_group: '3', description: 'Motricité globale',      max_score: 5 },
    { age_group: '3', description: 'Autonomie personnelle',  max_score: 5 },
    { age_group: '4', description: 'Expression orale',       max_score: 5 },
    { age_group: '4', description: 'Préparation à la lecture', max_score: 5 },
    { age_group: '4', description: 'Numération de base',     max_score: 5 },
    { age_group: '4', description: 'Créativité et imagination', max_score: 5 },
    { age_group: '5', description: 'Lecture',                max_score: 5 },
    { age_group: '5', description: 'Écriture',               max_score: 5 },
    { age_group: '5', description: 'Mathématiques',          max_score: 5 },
    { age_group: '5', description: 'Logique et raisonnement', max_score: 5 },
    { age_group: '5', description: 'Expression écrite',      max_score: 5 },
  ]});

  // ── 8. AppLookup ────────────────────────────────────────────────
  await prisma.appLookup.createMany({ data: [
    { category: 'regime', code: 'journee_complete',   label: 'Journée complète',         sort_order: 1 },
    { category: 'regime', code: 'demi_matin',         label: 'Demi-journée Matin',       sort_order: 2 },
    { category: 'regime', code: 'demi_apres_midi',    label: 'Demi-journée Après-midi',  sort_order: 3 },
    { category: 'age_group', code: '3', label: 'Petite Section (3 ans)',   sort_order: 1 },
    { category: 'age_group', code: '4', label: 'Moyenne Section (4 ans)',  sort_order: 2 },
    { category: 'age_group', code: '5', label: 'Grande Section (5 ans)',   sort_order: 3 },
    { category: 'fonction', code: 'enseignante',      label: 'Enseignante',              sort_order: 1 },
    { category: 'fonction', code: 'directrice',       label: 'Directrice',               sort_order: 2 },
    { category: 'fonction', code: 'femme_de_service', label: 'Femme de service',         sort_order: 3 },
  ]});

  // ── Helpers ──────────────────────────────────────────────────────
  const TARIFS = { journee_complete: 350, demi_matin: 200, demi_apres_midi: 200 };
  let inscNum = 1;
  let parentNum = 1;

  async function mkParent({ full_name, gender, email, phone, profession, cin, is_active = true, archived = false, archived_at = null }) {
    const username = `parent${String(parentNum++).padStart(2, '0')}`;
    const user = await prisma.user.create({ data: {
      username, password_hash: 'parent123',
      role: 'parent', full_name, email, phone, is_active,
    }});
    return prisma.parent.create({ data: {
      full_name, gender, email, phone,
      address: 'Tunis, Tunisie',
      profession: profession || null,
      cin: cin || null,
      user_id: user.id,
      archived,
      archived_at: archived_at ? new Date(archived_at) : null,
    }});
  }

  // ── 9. Active students 2025-2026 ─────────────────────────────────
  async function mkStudent({ full_name, gender, dob, class_id, grade, regime, sched_id,
    lieu_naissance, checklist, club_ids, cantine, transport, hasOverdue = false,
    father, mother,
  }) {
    const numero = `2526-${String(inscNum++).padStart(3, '0')}`;
    const tarif   = TARIFS[regime];
    const cantine_amt   = cantine   ? 80 : 0;
    const transport_amt = transport ? 60 : 0;

    const student = await prisma.student.create({ data: {
      full_name, gender, date_of_birth: new Date(dob),
      class_id, grade, schedule_id: sched_id, regime,
      registration_date: new Date('2025-09-01'),
      lieu_naissance: lieu_naissance || 'Tunis',
      nationalite: 'Tunisienne',
      numero_inscription: numero,
      heure_arrivee: regime === 'demi_apres_midi' ? '13:00' : '08:00',
      heure_depart:  regime === 'demi_matin'      ? '12:00' : '16:30',
      transport_mode: transport ? 'bus' : 'parent',
    }});

    const dad = await mkParent(father);
    const mom = await mkParent(mother);
    await prisma.studentParent.createMany({ data: [
      { student_id: student.id, parent_id: dad.id, relationship: 'father' },
      { student_id: student.id, parent_id: mom.id, relationship: 'mother' },
    ]});

    await prisma.medicalFile.create({ data: {
      student_id: student.id, last_update: new Date('2025-09-01'),
      allergies: '', chronic_conditions: '', vaccinations: 'Vaccins à jour',
      emergency_contact: father.phone,
    }});

    const cl = {
      student_id: student.id,
      photo_identite:             checklist.photo_identite             ?? true,
      extrait_naissance:          checklist.extrait_naissance          ?? true,
      certificat_medical:         checklist.certificat_medical         ?? true,
      fiche_renseignement_signee: checklist.fiche_renseignement_signee ?? true,
      vaccinations_a_jour:        checklist.vaccinations_a_jour        ?? true,
      copie_cin_pere:             checklist.copie_cin_pere             ?? true,
      copie_cin_mere:             checklist.copie_cin_mere             ?? true,
    };
    const docs = ['photo_identite','extrait_naissance','certificat_medical',
      'fiche_renseignement_signee','vaccinations_a_jour','copie_cin_pere','copie_cin_mere'];
    cl.completed = docs.every(k => cl[k] === true);
    await prisma.registrationChecklist.create({ data: cl });

    await prisma.studentPack.create({ data: {
      student_id: student.id, school_year: '2025-2026',
      regime, tarif_base: tarif, scolarite_amount: tarif,
      cantine_enabled: cantine, cantine_amount: cantine_amt,
      transport_enabled: transport, transport_amount: transport_amt,
      clubs: club_ids.map(id => ({ clubId: id })),
      inscription_amount: 150, inscription_paid: true,
      start_month: 9, end_month: 6,
    }});

    // Inscription payment
    await prisma.payment.create({ data: {
      student_id: student.id, parent_id: dad.id,
      type: 'inscription', amount: 150,
      due_date: new Date('2025-09-01'), paid_date: new Date('2025-09-02'),
      status: 'paid', description: 'Frais inscription 2025-2026', month: 9, year: 2025,
    }});

    // Monthly payments Sep–May
    const schedule = [
      {m:9,y:2025},{m:10,y:2025},{m:11,y:2025},{m:12,y:2025},
      {m:1,y:2026},{m:2,y:2026},{m:3,y:2026},{m:4,y:2026},{m:5,y:2026},
    ];
    const TODAY = new Date('2026-05-23');
    const monthly = tarif + cantine_amt + transport_amt;
    for (let i = 0; i < schedule.length; i++) {
      const { m, y } = schedule[i];
      const due = new Date(`${y}-${String(m).padStart(2,'0')}-05`);
      let status, paid_date;
      if (hasOverdue && i >= 7) {          // May overdue
        status = 'overdue'; paid_date = null;
      } else if (hasOverdue && i >= 6) {   // April overdue
        status = 'overdue'; paid_date = null;
      } else if (due <= TODAY) {
        status = 'paid';
        paid_date = new Date(due.getTime() + 3 * 86400000);
      } else {
        status = 'pending'; paid_date = null;
      }
      await prisma.payment.create({ data: {
        student_id: student.id, parent_id: dad.id,
        type: 'mensualite', amount: monthly,
        due_date: due, paid_date, status,
        description: `Mensualité ${m}/${y}`, month: m, year: y,
      }});
    }

    // Club memberships
    for (const clubId of club_ids) {
      await prisma.clubMembership.create({ data: {
        club_id: clubId, student_id: student.id,
        join_date: new Date('2025-10-01'), paid: true,
      }});
    }

    return student;
  }

  // ── PS students (3 ans — born 2022) ─────────────────────────────
  const ps1 = await mkStudent({
    full_name: 'Adam Ben Ali', gender: 'M', dob: '2022-03-15',
    class_id: classPS.id, grade: 'PS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubDessin.id, clubCoran.id], cantine: true, transport: false,
    father: { full_name: 'Khaled Ben Ali', gender: 'father', email: 'khaled.benali@gmail.com', phone: '21111001', profession: 'Ingénieur', cin: '09123001' },
    mother: { full_name: 'Sonia Ben Ali',  gender: 'mother', email: 'sonia.benali@gmail.com',  phone: '21111002', profession: 'Enseignante', cin: '09123002' },
  });

  const ps2 = await mkStudent({
    full_name: 'Yasmine Trabelsi', gender: 'F', dob: '2022-06-22',
    class_id: classPS.id, grade: 'PS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubAnglais.id, clubFete.id], cantine: true, transport: true,
    father: { full_name: 'Nabil Trabelsi', gender: 'father', email: 'nabil.trabelsi@gmail.com', phone: '21111003', profession: 'Médecin', cin: '09123003' },
    mother: { full_name: 'Rim Trabelsi',   gender: 'mother', email: 'rim.trabelsi@gmail.com',   phone: '21111004', profession: 'Pharmacienne', cin: '09123004' },
  });

  const ps3 = await mkStudent({
    full_name: 'Rania Chahed', gender: 'F', dob: '2022-01-10',
    class_id: classPS.id, grade: 'PS', regime: 'demi_matin', sched_id: schedMatin.id,
    checklist: { copie_cin_mere: false }, club_ids: [clubFrancais.id], cantine: false, transport: false,
    father: { full_name: 'Mounir Chahed', gender: 'father', email: 'mounir.chahed@gmail.com', phone: '21111005', profession: 'Comptable', cin: '09123005' },
    mother: { full_name: 'Amel Chahed',   gender: 'mother', email: 'amel.chahed@gmail.com',   phone: '21111006', profession: 'Secrétaire', cin: '09123006' },
  });

  const ps4 = await mkStudent({
    full_name: 'Karim Hammami', gender: 'M', dob: '2022-09-05',
    class_id: classPS.id, grade: 'PS', regime: 'demi_matin', sched_id: schedMatin.id,
    checklist: {}, club_ids: [clubSport.id, clubCalcul.id], cantine: false, transport: false,
    father: { full_name: 'Tarek Hammami', gender: 'father', email: 'tarek.hammami@gmail.com', phone: '21111007', profession: 'Architecte', cin: '09123007' },
    mother: { full_name: 'Wafa Hammami',  gender: 'mother', email: 'wafa.hammami@gmail.com',  phone: '21111008', profession: 'Infirmière', cin: '09123008' },
  });

  const ps5 = await mkStudent({
    full_name: 'Lina Bouaziz', gender: 'F', dob: '2022-04-18',
    class_id: classPS.id, grade: 'PS', regime: 'demi_apres_midi', sched_id: schedApresMidi.id,
    checklist: { certificat_medical: false, vaccinations_a_jour: false }, club_ids: [clubTheatre.id], cantine: false, transport: false,
    father: { full_name: 'Hedi Bouaziz',  gender: 'father', email: 'hedi.bouaziz@gmail.com',  phone: '21111009', profession: 'Commerçant', cin: '09123009' },
    mother: { full_name: 'Fatma Bouaziz', gender: 'mother', email: 'fatma.bouaziz@gmail.com', phone: '21111010', profession: null, cin: '09123010' },
  });

  const ps6 = await mkStudent({
    full_name: 'Omar Gharbi', gender: 'M', dob: '2022-07-30',
    class_id: classPS.id, grade: 'PS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubCoran.id, clubSport.id], cantine: true, transport: true,
    father: { full_name: 'Ridha Gharbi',  gender: 'father', email: 'ridha.gharbi@gmail.com',  phone: '21111011', profession: 'Militaire', cin: '09123011' },
    mother: { full_name: 'Latifa Gharbi', gender: 'mother', email: 'latifa.gharbi@gmail.com', phone: '21111012', profession: 'Femme au foyer', cin: '09123012' },
  });

  // ── MS students (4 ans — born 2021) ─────────────────────────────
  const ms1 = await mkStudent({
    full_name: 'Sami Khalil', gender: 'M', dob: '2021-02-14',
    class_id: classMS.id, grade: 'MS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubCalcul.id, clubAnglais.id, clubSport.id], cantine: true, transport: true, hasOverdue: true,
    father: { full_name: 'Bechir Khalil', gender: 'father', email: 'bechir.khalil@gmail.com', phone: '21222001', profession: 'Entrepreneur', cin: '08234001' },
    mother: { full_name: 'Salma Khalil',  gender: 'mother', email: 'salma.khalil@gmail.com',  phone: '21222002', profession: 'Designer', cin: '08234002' },
  });

  const ms2 = await mkStudent({
    full_name: 'Nour Meddeb', gender: 'F', dob: '2021-08-25',
    class_id: classMS.id, grade: 'MS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubFrancais.id, clubTheatre.id], cantine: true, transport: false,
    father: { full_name: 'Adel Meddeb', gender: 'father', email: 'adel.meddeb@gmail.com', phone: '21222003', profession: 'Notaire', cin: '08234003' },
    mother: { full_name: 'Ines Meddeb', gender: 'mother', email: 'ines.meddeb@gmail.com', phone: '21222004', profession: 'Avocate', cin: '08234004' },
  });

  const ms3 = await mkStudent({
    full_name: 'Tarek Jlassi', gender: 'M', dob: '2021-05-03',
    class_id: classMS.id, grade: 'MS', regime: 'demi_matin', sched_id: schedMatin.id,
    checklist: { extrait_naissance: false }, club_ids: [clubDessin.id, clubCalcul.id], cantine: false, transport: false,
    father: { full_name: 'Walid Jlassi', gender: 'father', email: 'walid.jlassi@gmail.com', phone: '21222005', profession: 'Technicien', cin: '08234005' },
    mother: { full_name: 'Naima Jlassi', gender: 'mother', email: 'naima.jlassi@gmail.com', phone: '21222006', profession: 'Coiffeuse', cin: '08234006' },
  });

  const ms4 = await mkStudent({
    full_name: 'Hana Dridi', gender: 'F', dob: '2021-11-17',
    class_id: classMS.id, grade: 'MS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubAnglais.id, clubFete.id, clubTheatre.id], cantine: true, transport: false,
    father: { full_name: 'Slim Dridi', gender: 'father', email: 'slim.dridi@gmail.com', phone: '21222007', profession: 'Pilote', cin: '08234007' },
    mother: { full_name: 'Hela Dridi', gender: 'mother', email: 'hela.dridi@gmail.com', phone: '21222008', profession: "Hôtesse de l'air", cin: '08234008' },
  });

  const ms5 = await mkStudent({
    full_name: 'Ines Ayari', gender: 'F', dob: '2021-03-29',
    class_id: classMS.id, grade: 'MS', regime: 'demi_apres_midi', sched_id: schedApresMidi.id,
    checklist: { photo_identite: false, certificat_medical: false }, club_ids: [clubCoran.id], cantine: false, transport: false,
    father: { full_name: 'Fares Ayari', gender: 'father', email: 'fares.ayari@gmail.com', phone: '21222009', profession: 'Policier', cin: '08234009' },
    mother: { full_name: 'Lobna Ayari', gender: 'mother', email: 'lobna.ayari@gmail.com', phone: '21222010', profession: 'Institutrice', cin: '08234010' },
  });

  const ms6 = await mkStudent({
    full_name: 'Zied Nasri', gender: 'M', dob: '2021-07-12',
    class_id: classMS.id, grade: 'MS', regime: 'demi_apres_midi', sched_id: schedApresMidi.id,
    checklist: {}, club_ids: [clubSport.id, clubDessin.id], cantine: false, transport: false,
    father: { full_name: 'Amine Nasri', gender: 'father', email: 'amine.nasri@gmail.com', phone: '21222011', profession: 'Informaticien', cin: '08234011' },
    mother: { full_name: 'Samia Nasri', gender: 'mother', email: 'samia.nasri@gmail.com', phone: '21222012', profession: 'Graphiste', cin: '08234012' },
  });

  // ── GS students (5 ans — born 2020) ─────────────────────────────
  const gs1 = await mkStudent({
    full_name: 'Mariem Saidi', gender: 'F', dob: '2020-04-07',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubCalcul.id, clubFrancais.id, clubFete.id], cantine: true, transport: true,
    father: { full_name: 'Mondher Saidi', gender: 'father', email: 'mondher.saidi@gmail.com', phone: '21333001', profession: 'Ingénieur Télécom', cin: '07345001' },
    mother: { full_name: 'Khaoula Saidi', gender: 'mother', email: 'khaoula.saidi@gmail.com', phone: '21333002', profession: 'Économiste', cin: '07345002' },
  });

  const gs2 = await mkStudent({
    full_name: 'Khalil Ben Romdhane', gender: 'M', dob: '2020-09-14',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubAnglais.id, clubTheatre.id], cantine: true, transport: false,
    father: { full_name: 'Mohamed Ben Romdhane', gender: 'father', email: 'med.benromdhane@gmail.com', phone: '21333003', profession: 'Chirurgien', cin: '07345003' },
    mother: { full_name: 'Leila Ben Romdhane',   gender: 'mother', email: 'leila.benromdhane@gmail.com', phone: '21333004', profession: 'Radiologue', cin: '07345004' },
  });

  const gs3 = await mkStudent({
    full_name: 'Sara Ouali', gender: 'F', dob: '2020-01-22',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: { fiche_renseignement_signee: false }, club_ids: [clubDessin.id, clubCalcul.id], cantine: true, transport: false, hasOverdue: true,
    father: { full_name: 'Lotfi Ouali',   gender: 'father', email: 'lotfi.ouali@gmail.com',   phone: '21333005', profession: 'Vétérinaire', cin: '07345005' },
    mother: { full_name: 'Nesrine Ouali', gender: 'mother', email: 'nesrine.ouali@gmail.com', phone: '21333006', profession: 'Pharmacienne', cin: '07345006' },
  });

  const gs4 = await mkStudent({
    full_name: 'Walid Ferjani', gender: 'M', dob: '2020-06-30',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubSport.id, clubCoran.id], cantine: false, transport: false,
    father: { full_name: 'Kamel Ferjani', gender: 'father', email: 'kamel.ferjani@gmail.com', phone: '21333007', profession: 'Professeur', cin: '07345007' },
    mother: { full_name: 'Olfa Ferjani',  gender: 'mother', email: 'olfa.ferjani@gmail.com',  phone: '21333008', profession: 'Professeure', cin: '07345008' },
  });

  const gs5 = await mkStudent({
    full_name: 'Amira Bchini', gender: 'F', dob: '2020-11-05',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubFrancais.id, clubTheatre.id, clubFete.id], cantine: true, transport: true,
    father: { full_name: 'Hatem Bchini', gender: 'father', email: 'hatem.bchini@gmail.com', phone: '21333009', profession: 'Dentiste', cin: '07345009' },
    mother: { full_name: 'Nadia Bchini', gender: 'mother', email: 'nadia.bchini@gmail.com', phone: '21333010', profession: 'Pédiatre', cin: '07345010' },
  });

  const gs6 = await mkStudent({
    full_name: 'Anis Labidi', gender: 'M', dob: '2020-08-19',
    class_id: classGS.id, grade: 'GS', regime: 'journee_complete', sched_id: schedJournee.id,
    checklist: {}, club_ids: [clubCalcul.id, clubSport.id], cantine: false, transport: false,
    father: { full_name: 'Riadh Labidi', gender: 'father', email: 'riadh.labidi@gmail.com', phone: '21333011', profession: 'Banquier', cin: '07345011' },
    mother: { full_name: 'Sarra Labidi', gender: 'mother', email: 'sarra.labidi@gmail.com', phone: '21333012', profession: 'Traductrice', cin: '07345012' },
  });

  // ── 10. Archived students ────────────────────────────────────────
  async function mkArchived({ full_name, gender, dob, class_id, grade, school_year,
    archived_at, reason, parentFull, parentEmail, parentPhone, parentActive = true }) {
    const yy = school_year.replace('-', '').slice(2, 6);
    const numero = `${yy}-${String(inscNum++).padStart(3, '0')}`;
    const regYear = parseInt(school_year.split('-')[0]);

    const student = await prisma.student.create({ data: {
      full_name, gender, date_of_birth: new Date(dob),
      class_id, grade, schedule_id: schedJournee.id,
      registration_date: new Date(`${regYear}-09-01`),
      regime: 'journee_complete', numero_inscription: numero,
      archived: true, archived_at: new Date(archived_at), archived_by: 'admin',
      unregistered_at: new Date(archived_at), unregistered_reason: reason,
    }});

    const username = `arch_parent${parentNum++}`;
    const pUser = await prisma.user.create({ data: {
      username, password_hash: 'parent123',
      role: 'parent', full_name: parentFull,
      email: parentEmail, phone: parentPhone, is_active: parentActive,
    }});
    const parent = await prisma.parent.create({ data: {
      full_name: parentFull, gender: 'father',
      email: parentEmail, phone: parentPhone, address: 'Tunis',
      user_id: pUser.id,
      archived: !parentActive,
      archived_at: !parentActive ? new Date(archived_at) : null,
    }});
    await prisma.studentParent.create({ data: { student_id: student.id, parent_id: parent.id, relationship: 'father' }});
    await prisma.medicalFile.create({ data: { student_id: student.id, last_update: new Date(archived_at) }});
    await prisma.registrationChecklist.create({ data: {
      student_id: student.id,
      photo_identite: true, extrait_naissance: true, certificat_medical: true,
      fiche_renseignement_signee: true, vaccinations_a_jour: true,
      copie_cin_pere: true, copie_cin_mere: true, completed: true,
    }});
    return student;
  }

  // Départs en cours d'année 2025-2026
  await mkArchived({ full_name: 'Mehdi Khelil',  gender: 'M', dob: '2021-03-10', class_id: classMS.id, grade: 'MS', school_year: '2025-2026', archived_at: '2026-01-15', reason: "Déménagement à l'étranger",          parentFull: 'Samir Khelil',   parentEmail: 'samir.khelil@gmail.com',   parentPhone: '21444001', parentActive: false });
  await mkArchived({ full_name: 'Fatma Zouari',  gender: 'F', dob: '2022-05-15', class_id: classPS.id, grade: 'PS', school_year: '2025-2026', archived_at: '2026-03-01', reason: 'Transfert dans une autre école',   parentFull: 'Houssem Zouari', parentEmail: 'houssem.zouari@gmail.com', parentPhone: '21444002', parentActive: true  });

  // Archivés 2024-2025
  await mkArchived({ full_name: 'Hamza Ben Salem', gender: 'M', dob: '2019-07-20', class_id: classGS.id, grade: 'GS', school_year: '2024-2025', archived_at: '2025-07-01', reason: 'Fin de cycle préscolaire — entrée CP', parentFull: 'Ali Ben Salem',   parentEmail: 'ali.bensalem@gmail.com',   parentPhone: '21555001', parentActive: false });
  await mkArchived({ full_name: 'Leila Bougacha', gender: 'F', dob: '2020-09-12', class_id: classMS.id, grade: 'MS', school_year: '2024-2025', archived_at: '2025-07-01', reason: "Fin d'année — non réinscrit",        parentFull: 'Maher Bougacha', parentEmail: 'maher.bougacha@gmail.com', parentPhone: '21555002', parentActive: true  });
  await mkArchived({ full_name: 'Youssef Tounsi', gender: 'M', dob: '2021-02-28', class_id: classPS.id, grade: 'PS', school_year: '2024-2025', archived_at: '2025-07-01', reason: "Fin d'année — non réinscrit",        parentFull: 'Saber Tounsi',   parentEmail: 'saber.tounsi@gmail.com',   parentPhone: '21555003', parentActive: false });
  await mkArchived({ full_name: 'Rim Chaabane',   gender: 'F', dob: '2019-12-05', class_id: classGS.id, grade: 'GS', school_year: '2024-2025', archived_at: '2025-07-01', reason: 'Fin de cycle préscolaire — entrée CP', parentFull: 'Hichem Chaabane', parentEmail: 'hichem.chaabane@gmail.com', parentPhone: '21555004', parentActive: false });

  // Archivés 2023-2024
  await mkArchived({ full_name: 'Bilel Mansouri',  gender: 'M', dob: '2018-04-15', class_id: classGS.id, grade: 'GS', school_year: '2023-2024', archived_at: '2024-07-01', reason: 'Fin de cycle préscolaire — entrée CP', parentFull: 'Tarek Mansouri', parentEmail: 'tarek.mansouri@gmail.com', parentPhone: '21666001', parentActive: false });
  await mkArchived({ full_name: 'Dalel Sfaxi',     gender: 'F', dob: '2019-08-22', class_id: classGS.id, grade: 'GS', school_year: '2023-2024', archived_at: '2024-07-01', reason: 'Fin de cycle préscolaire — entrée CP', parentFull: 'Karim Sfaxi',    parentEmail: 'karim.sfaxi@gmail.com',    parentPhone: '21666002', parentActive: false });
  await mkArchived({ full_name: 'Rafik Ben Younes', gender: 'M', dob: '2019-11-08', class_id: classMS.id, grade: 'MS', school_year: '2023-2024', archived_at: '2024-07-01', reason: 'Déménagement',                       parentFull: 'Nadir Ben Younes', parentEmail: 'nadir.benyounes@gmail.com', parentPhone: '21666003', parentActive: true  });

  // ── 11. Absences ─────────────────────────────────────────────────
  const absences = [
    { s: ms1, date: '2026-02-10', reason: 'Maladie (grippe)',             excused: true,  cert: true  },
    { s: ms1, date: '2026-02-11', reason: 'Maladie (grippe) — J2',       excused: true,  cert: true  },
    { s: ps3, date: '2026-03-05', reason: 'Rendez-vous médical',          excused: true,  cert: false },
    { s: gs3, date: '2026-01-20', reason: 'Absence injustifiée',          excused: false, cert: false },
    { s: ps6, date: '2026-04-02', reason: 'Congé familial',               excused: true,  cert: false },
    { s: ms3, date: '2026-04-15', reason: 'Maladie',                      excused: true,  cert: true  },
    { s: gs2, date: '2026-05-06', reason: 'Absence injustifiée',          excused: false, cert: false },
    { s: ps2, date: '2025-11-18', reason: 'Fête familiale',               excused: true,  cert: false },
    { s: ms4, date: '2025-12-03', reason: 'Maladie (angine)',             excused: true,  cert: true  },
    { s: gs5, date: '2026-03-17', reason: 'Rendez-vous spécialiste',      excused: true,  cert: false },
    { s: gs1, date: '2026-04-22', reason: 'Voyage familial',              excused: true,  cert: false },
    { s: ps4, date: '2026-05-12', reason: 'Absence injustifiée',          excused: false, cert: false },
  ];
  for (const a of absences) {
    await prisma.absence.create({ data: {
      student_id: a.s.id, date: new Date(a.date),
      reason: a.reason, excused: a.excused,
      medical_certificate: a.cert, apt_to_return: a.excused,
      recorded_by: 'admin',
    }});
  }

  // ── 12. Events / Annonces ────────────────────────────────────────
  await prisma.event.createMany({ data: [
    { name: 'Réunion de rentrée 2025-2026',       description: "Réunion d'accueil des parents. Présentation de l'équipe pédagogique et du programme annuel.",                  event_date: new Date('2025-09-03T09:00:00'), location: 'Salle de réunion',    registration_fee: 0  },
    { name: 'Journée portes ouvertes',             description: 'Découverte des installations, visite guidée des classes et rencontre avec les enseignantes.',                  event_date: new Date('2025-10-10T10:00:00'), location: 'Tout l\'établissement', registration_fee: 0  },
    { name: "Atelier parents — Éveil musical",     description: 'Atelier pratique pour initier les enfants à la musique. Percussion et chansons en groupe.',                    event_date: new Date('2025-11-20T14:00:00'), location: "Salle d'activités",   registration_fee: 5  },
    { name: 'Sortie pédagogique — Musée du Bardo', description: 'Visite éducative du Musée National du Bardo. Mosaïques romaines et patrimoine tunisien.',                     event_date: new Date('2026-02-12T08:30:00'), location: 'Musée du Bardo, Tunis', registration_fee: 10 },
    { name: 'Fête des mères',                      description: 'Célébration de la fête des mères avec spectacle préparé par les enfants. Bricolage et chansons.',             event_date: new Date('2026-05-15T15:00:00'), location: "Cour de l'école",     registration_fee: 0  },
    { name: 'Inscription session été 2026',        description: "Séance d'information pour les inscriptions à la session d'été. Programme clubs, activités et tarifs.",         event_date: new Date('2026-05-28T10:00:00'), location: 'Secrétariat',         registration_fee: 0  },
    { name: 'Réunion bilan 3ème trimestre',        description: "Réunion parents-enseignantes pour les bilans du 3ème trimestre et recommandations pour l'année prochaine.",   event_date: new Date('2026-06-03T17:00:00'), location: 'Salles de classe',    registration_fee: 0  },
    { name: "Spectacle de fin d'année 2025-2026",  description: "Grand spectacle avec toutes les sections : chants, danses, théatre et remise des diplômes préscolaires.",     event_date: new Date('2026-06-10T15:00:00'), location: 'Salle des fêtes',     registration_fee: 0  },
    { name: "Journée d'été — Activités aquatiques", description: 'Jeux d\'eau, piscine gonflable et activités extérieures pour la session été.',                               event_date: new Date('2026-07-15T09:00:00'), location: "Jardin de l'école",   registration_fee: 15 },
  ]});

  // ── 13. StaffSalaryPayments (Sep 2025 – Apr 2026) ────────────────
  const salaries = {
    [dirTeacher.id]: 1000,
    [ens1.id]: 600, [ens2.id]: 600, [ens3.id]: 600,
    [fds.id]: 500,
  };
  const paidMonths = [
    {m:9,y:2025},{m:10,y:2025},{m:11,y:2025},{m:12,y:2025},
    {m:1,y:2026},{m:2,y:2026},{m:3,y:2026},{m:4,y:2026},
  ];
  for (const teacher of [dirTeacher, ens1, ens2, ens3, fds]) {
    for (const { m, y } of paidMonths) {
      await prisma.staffSalaryPayment.create({ data: {
        teacher_id: teacher.id, month: m, year: y,
        amount: salaries[teacher.id],
        paid_at: new Date(`${y}-${String(m).padStart(2,'0')}-28`),
        notes: `Salaire ${m}/${y}`,
      }});
    }
  }

  // ── 14. Summer packs (session juillet 2026) ───────────────────────
  await prisma.summerPack.create({ data: {
    student_id: ms1.id, month: 7, year: 2026,
    pack_amount: 0,
    clubs_json: [
      { clubId: clubJeuxEau.id,   name: "Jeux d'eau",   price: 0   },
      { clubId: clubCinema.id,    name: 'Cinéma',       price: 0   },
      { clubId: clubRobotique.id, name: 'Robotique',    price: 100 },
    ],
    robotique: true, robotique_amount: 100,
    total_amount: 100, paid: false,
  }});
  await prisma.summerPack.create({ data: {
    student_id: gs1.id, month: 7, year: 2026,
    pack_amount: 0,
    clubs_json: [
      { clubId: clubJeuxEau.id, name: "Jeux d'eau",   price: 0  },
      { clubId: clubInfo.id,    name: 'Informatique', price: 30 },
      { clubId: clubCinema.id,  name: 'Cinéma',       price: 0  },
    ],
    total_amount: 30, paid: true, paid_date: new Date('2026-05-20'),
  }});

  // ── 15. Notifications — dossiers incomplets ───────────────────────
  const incompleteDossiers = await prisma.registrationChecklist.findMany({
    where: { completed: false },
    include: { student: true },
  });
  const admins = await prisma.user.findMany({ where: { role: 'administrator' } });
  for (const admin of admins) {
    for (const cl of incompleteDossiers) {
      if (!cl.student.archived) {
        await prisma.notification.create({ data: {
          user_id: admin.id,
          title: '📋 Dossier incomplet',
          message: `${cl.student.full_name} — Dossier d'inscription incomplet`,
          type: 'dossier',
          link: `/list/students/${cl.student.id}`,
          read: false,
        }});
      }
    }
  }

  // ── Résumé ───────────────────────────────────────────────────────
  const c = {
    active:  await prisma.student.count({ where: { archived: false } }),
    total:   await prisma.student.count(),
    parents: await prisma.parent.count(),
    users:   await prisma.user.count(),
    clubs:   await prisma.club.count(),
    absences:await prisma.absence.count(),
    events:  await prisma.event.count(),
    notifs:  await prisma.notification.count(),
    payments:await prisma.payment.count(),
  };
  console.log('');
  console.log('✅ Seed complet !');
  console.log(`   👦 Élèves actifs       : ${c.active} (PS:6  MS:6  GS:6)`);
  console.log(`   📚 Élèves total        : ${c.total} (dont ${c.total - c.active} archivés)`);
  console.log(`   👨‍👩‍👧 Parents             : ${c.parents}`);
  console.log(`   👤 Utilisateurs        : ${c.users}`);
  console.log(`   🎨 Clubs               : ${c.clubs} (8 réguliers + 4 été)`);
  console.log(`   📅 Absences            : ${c.absences}`);
  console.log(`   📣 Annonces/Événements : ${c.events} (5 passées + 4 futures)`);
  console.log(`   🔔 Notifications       : ${c.notifs}`);
  console.log(`   💳 Paiements           : ${c.payments}`);
  console.log('');
  console.log('   Comptes admin : admin / Kh&+231107');
  console.log('                   directrice / directrice123');
  console.log('   Enseignantes  : enseignante_ps, enseignante_ms, enseignante_gs / ens123');
  console.log('   Femme service : femme_service / fds123');
  console.log('   Parents       : parent01..parent36 / parent123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
