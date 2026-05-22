	import { PrismaClient } from '@prisma/client';
	const prisma = new PrismaClient();

async function main() {
	// Création d'un emploi du temps commun
	const schedule = await prisma.schedule.create({
		data: {
			name: 'جدول صباحي',
			description: 'من 8 إلى 12',
			start_time: '08:00',
			end_time: '12:00',
			days_of_week: 'الأحد-الخميس',
		},
	});
	// 1 Administrateur
	await prisma.user.create({
		data: {
			username: 'admin',
			password_hash: 'admin123',
			role: 'administrator',
			full_name: 'محمد الإداري',
			email: 'admin@kinder.com',
			phone: '10000001',
		},
	});

	// 1 Directrice
	await prisma.user.create({
		data: {
			username: 'directrice',
			password_hash: 'directrice123',
			role: 'administrator',
			full_name: 'فاطمة المديرة',
			email: 'directrice@kinder.com',
			phone: '10000002',
		},
	});

		// 2 Enseignantes
		const enseignantesData = [
			{
				username: 'enseignante1',
				password_hash: 'enseignante123',
				role: 'teacher',
				full_name: 'سعاد معلمة',
				email: 's1@kinder.com',
				phone: '10000003',
			},
			{
				username: 'enseignante2',
				password_hash: 'enseignante456',
				role: 'teacher',
				full_name: 'ليلى معلمة',
				email: 's2@kinder.com',
				phone: '10000004',
			},
		];
		const enseignanteIds: string[] = [];
		for (const ens of enseignantesData) {
			const user = await prisma.user.create({ data: ens });
			const teacher = await prisma.teacher.create({
				data: {
					user_id: user.id,
					hire_date: new Date('2022-09-01'),
					qualification: 'Licence',
				},
			});
			enseignanteIds.push(teacher.id);
		}

	// Clubs (3 clubs + Cantine)
	const clubNames = [
		{ name: 'الرسم', description: 'نادي الرسم', fee: 20 },
		{ name: 'الموسيقى', description: 'نادي الموسيقى', fee: 25 },
		{ name: 'الرياضة', description: 'نادي الرياضة', fee: 15 },
		{ name: 'الكانتين', description: 'خدمة الكانتين', fee: 30 },
	];
	const clubs = [];
	for (const c of clubNames) {
		clubs.push(await prisma.club.create({
			data: {
				name: c.name,
				description: c.description,
				membership_fee: c.fee,
				age_group: '3-5',
			},
		}));
	}

	// 15 parents (5 avec 2 enfants, 10 avec 1 enfant)
	const parents = [];
	for (let i = 1; i <= 15; i++) {
		const parent = await prisma.user.create({
			data: {
				username: `parent${i}`,
				password_hash: `parent${i}pass`,
				role: 'parent',
				full_name: `ولي الأمر ${i < 10 ? '٠' + i : i}`,
				email: `parent${i}@kinder.com`,
				phone: `200000${i < 10 ? '0' + i : i}`,
			},
		});
		parents.push(await prisma.parent.create({
			data: {
				full_name: parent.full_name,
				email: parent.email!,
				phone: parent.phone!,
				address: `شارع ${i}`,
				user_id: parent.id,
			},
		}));
	}

	// 20 élèves (5 parents avec 2 enfants, 10 parents avec 1 enfant)
	const eleves = [];
	let eleveIndex = 1;
	// Parents 1 à 5 : 2 enfants chacun
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 2; j++) {
			eleves.push({
				full_name: `تلميذ ${eleveIndex < 10 ? '٠' + eleveIndex : eleveIndex}`,
				parent: parents[i],
			});
			eleveIndex++;
		}
	}
	// Parents 6 à 15 : 1 enfant chacun
	for (let i = 5; i < 15; i++) {
		eleves.push({
			full_name: `تلميذ ${eleveIndex < 10 ? '٠' + eleveIndex : eleveIndex}`,
			parent: parents[i],
		});
		eleveIndex++;
	}

	// Créer les élèves, les lier à leur parent, et les inscrire dans une classe, un club, la cantine
					const class1 = await prisma.class.create({
						data: {
							name: 'الصف الصغير',
							teacher_id: enseignanteIds[0],
							age_group: '3-4',
							room_number: 'A1',
							schedule_id: schedule.id,
						},
					});
					const class2 = await prisma.class.create({
						data: {
							name: 'الصف المتوسط',
							teacher_id: enseignanteIds[1],
							age_group: '4-5',
							room_number: 'B1',
							schedule_id: schedule.id,
						},
					});

	for (let i = 0; i < eleves.length; i++) {
		const e = eleves[i];
						const student = await prisma.student.create({
							data: {
								full_name: e.full_name,
								date_of_birth: new Date(`2020-0${(i % 9) + 1}-0${((i % 5) + 1)}`),
								class_id: i < 10 ? class1.id : class2.id,
								grade: i < 10 ? 'PS' : 'MS',
								schedule_id: schedule.id,
								registration_date: new Date('2024-09-01'),
							},
						});
		await prisma.studentParent.create({
			data: {
				student_id: student.id,
				parent_id: e.parent.id,
				relationship: 'father',
			},
		});
		// Inscription club/cantine
		if (i < 5) {
			// 5 premiers élèves : club 1
			await prisma.clubMembership.create({
				data: {
					club_id: clubs[0].id,
					student_id: student.id,
					join_date: new Date('2024-10-01'),
					paid: true,
				},
			});
		} else if (i < 10) {
			// 6-10 : club 2
			await prisma.clubMembership.create({
				data: {
					club_id: clubs[1].id,
					student_id: student.id,
					join_date: new Date('2024-10-01'),
					paid: true,
				},
			});
		} else if (i < 15) {
			// 11-15 : club 3
			await prisma.clubMembership.create({
				data: {
					club_id: clubs[2].id,
					student_id: student.id,
					join_date: new Date('2024-10-01'),
					paid: true,
				},
			});
		}
		// 15 élèves à la cantine (1-15)
		if (i < 15) {
			await prisma.clubMembership.create({
				data: {
					club_id: clubs[3].id,
					student_id: student.id,
					join_date: new Date('2024-10-01'),
					paid: true,
				},
			});
		}
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
