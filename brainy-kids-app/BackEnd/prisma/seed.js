const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
	// Vérifier si le seed a déjà été exécuté
	const existing = await prisma.user.findFirst({ where: { username: 'admin' } });
	if (existing) {
		console.log('✅ Seed déjà exécuté — aucune action.');
		return;
	}

	const schedule = await prisma.schedule.create({
		data: { name: 'جدول صباحي', description: 'من 8 إلى 12', start_time: '08:00', end_time: '12:00', days_of_week: 'الأحد-الخميس' },
	});

	await prisma.user.create({ data: { username: 'admin', password_hash: 'admin123', role: 'administrator', full_name: 'محمد الإداري', email: 'admin@kinder.com', phone: '10000001' } });
	await prisma.user.create({ data: { username: 'directrice', password_hash: 'directrice123', role: 'administrator', full_name: 'فاطمة المديرة', email: 'directrice@kinder.com', phone: '10000002' } });

	const enseignantesData = [
		{ username: 'enseignante1', password_hash: 'enseignante123', role: 'teacher', full_name: 'سعاد معلمة', email: 's1@kinder.com', phone: '10000003' },
		{ username: 'enseignante2', password_hash: 'enseignante456', role: 'teacher', full_name: 'ليلى معلمة', email: 's2@kinder.com', phone: '10000004' },
		{ username: 'enseignante3', password_hash: 'enseignante789', role: 'teacher', full_name: 'نجوى معلمة', email: 's3@kinder.com', phone: '10000005' },
	];
	const enseignanteIds = [];
	for (const ens of enseignantesData) {
		const user = await prisma.user.create({ data: ens });
		const teacher = await prisma.teacher.create({ data: { user_id: user.id, hire_date: new Date('2022-09-01'), qualification: 'Licence' } });
		enseignanteIds.push(teacher.id);
	}

	const clubNames = [
		{ name: 'الرسم', description: 'نادي الرسم', fee: 20 },
		{ name: 'الموسيقى', description: 'نادي الموسيقى', fee: 25 },
		{ name: 'الرياضة', description: 'نادي الرياضة', fee: 15 },
		{ name: 'الكانتين', description: 'خدمة الكانتين', fee: 30 },
	];
	const clubs = [];
	for (const c of clubNames) {
		clubs.push(await prisma.club.create({ data: { name: c.name, description: c.description, membership_fee: c.fee, age_group: '3-5' } }));
	}

	const parents = [];
	for (let i = 1; i <= 15; i++) {
		const user = await prisma.user.create({
			data: { username: `parent${i}`, password_hash: `parent${i}pass`, role: 'parent', full_name: `ولي الأمر ${i < 10 ? '٠' + i : i}`, email: `parent${i}@kinder.com`, phone: `200000${i < 10 ? '0' + i : i}` },
		});
		parents.push(await prisma.parent.create({ data: { full_name: user.full_name, email: user.email, phone: user.phone, address: `شارع ${i}`, user_id: user.id } }));
	}

	// ─── 3 Classes : PS (3 ans), MS (4 ans), GS (5 ans) ──────
	const class1 = await prisma.class.create({ data: { name: 'الصف الصغير — PS',   teacher_id: enseignanteIds[0], age_group: '3', room_number: 'A1', schedule_id: schedule.id } });
	const class2 = await prisma.class.create({ data: { name: 'الصف المتوسط — MS', teacher_id: enseignanteIds[1], age_group: '4', room_number: 'B1', schedule_id: schedule.id } });
	const class3 = await prisma.class.create({ data: { name: 'الصف الكبير — GS',  teacher_id: enseignanteIds[2], age_group: '5', room_number: 'C1', schedule_id: schedule.id } });

	// Dates de naissance par tranche d'âge (calculées pour avoir exactement l'âge en 2026)
	const dobPS = (i) => new Date(`2022-0${(i % 9) + 1}-0${(i % 5) + 1}`); // 3 ans → né en 2022
	const dobMS = (i) => new Date(`2021-0${(i % 9) + 1}-0${(i % 5) + 1}`); // 4 ans → né en 2021
	const dobGS = (i) => new Date(`2020-0${(i % 9) + 1}-0${(i % 5) + 1}`); // 5 ans → né en 2020

	// 7 élèves PS, 7 élèves MS, 6 élèves GS = 20 élèves
	const elevesConfig = [
		// PS — 7 élèves (3 ans)
		...Array.from({ length: 7 }, (_, i) => ({ idx: i, class_id: class1.id, grade: 'PS', dob: dobPS(i), parent: parents[i] })),
		// MS — 7 élèves (4 ans)
		...Array.from({ length: 7 }, (_, i) => ({ idx: i, class_id: class2.id, grade: 'MS', dob: dobMS(i), parent: parents[i + 7] })),
		// GS — 6 élèves (5 ans)
		...Array.from({ length: 6 }, (_, i) => ({ idx: i, class_id: class3.id, grade: 'GS', dob: dobGS(i), parent: parents[Math.min(i + 14, 14)] })),
	];

	for (let i = 0; i < elevesConfig.length; i++) {
		const e = elevesConfig[i];
		const num = String(i + 1).padStart(2, '0');
		const student = await prisma.student.create({
			data: {
				full_name: `تلميذ ${num}`,
				date_of_birth: e.dob,
				class_id: e.class_id,
				grade: e.grade,
				gender: i % 2 === 0 ? 'M' : 'F',
				schedule_id: schedule.id,
				registration_date: new Date('2024-09-01'),
			},
		});
		await prisma.studentParent.create({ data: { student_id: student.id, parent_id: e.parent.id, relationship: 'father' } });
		// Clubs
		const clubIdx = i % clubs.length;
		await prisma.clubMembership.create({ data: { club_id: clubs[clubIdx].id, student_id: student.id, join_date: new Date('2024-10-01'), paid: true } });
	}

	// ─── Événements de test (dates dynamiques pour le filtrage) ───
	const today     = new Date();
	today.setHours(9, 0, 0, 0);

	const in3days   = new Date(today);
	in3days.setDate(today.getDate() + 3);
	in3days.setHours(10, 0, 0, 0);

	const in3daysB  = new Date(today);
	in3daysB.setDate(today.getDate() + 3);
	in3daysB.setHours(14, 0, 0, 0);

	const in7days   = new Date(today);
	in7days.setDate(today.getDate() + 7);
	in7days.setHours(9, 0, 0, 0);

	await prisma.event.createMany({
		data: [
			{
				name: 'اجتماع أولياء الأمور',
				description: 'اجتماع دوري مع أولياء أمور الصف الصغير',
				event_date: today,
				location: 'قاعة الاجتماعات',
				registration_fee: 0,
			},
			{
				name: 'ورشة الرسم',
				description: 'ورشة رسم إبداعية للأطفال — الفوج الأول',
				event_date: in3days,
				location: 'قاعة الأنشطة',
				registration_fee: 5,
			},
			{
				name: 'حفلة القصص',
				description: 'جلسة قراءة وسرد القصص للأطفال',
				event_date: in3daysB,
				location: 'الفناء الخارجي',
				registration_fee: 0,
			},
			{
				name: 'يوم الرياضة',
				description: 'يوم رياضي مفتوح للأطفال وأولياء الأمور',
				event_date: in7days,
				location: 'الملعب',
				registration_fee: 0,
			},
		],
	});

	// ─── Résumé ───────────────────────────────────────────────
	console.log('✅ Seed terminé avec succès ! 20 élèves, 15 parents, 2 enseignantes créés.');
	console.log(`📅 Événements créés :`);
	console.log(`   - Aujourd'hui      : اجتماع أولياء الأمور`);
	console.log(`   - Dans 3 jours (x2): ورشة الرسم + حفلة القصص`);
	console.log(`   - Dans 7 jours    : يوم الرياضة`);
}

main()
	.catch((e) => { console.error(e); process.exit(1); })
	.finally(async () => { await prisma.$disconnect(); });
