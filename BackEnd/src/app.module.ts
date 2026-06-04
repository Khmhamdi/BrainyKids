import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { ParentsModule } from './parents/parents.module';
import { ClassesModule } from './classes/classes.module';
import { PaymentsModule } from './payments/payments.module';
import { AbsencesModule } from './absences/absences.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { EventsModule } from './events/events.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { PacksModule } from './packs/packs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotesModule } from './notes/notes.module';
import { ClubsModule } from './clubs/clubs.module';
import { SettingsModule } from './settings/settings.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PreRegistrationsModule } from './pre-registrations/pre-registrations.module';
import { SchoolYearsModule } from './school-years/school-years.module';

@Module({
  imports: [
    // Limitation des requêtes (anti-brute-force)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    StudentsModule,
    TeachersModule,
    ParentsModule,
    ClassesModule,
    PaymentsModule,
    AbsencesModule,
    AnnouncementsModule,
    EventsModule,
    DashboardModule,
    UploadModule,
    PacksModule,
    NotificationsModule,
    NotesModule,
    ClubsModule,
    SettingsModule,
    SchedulesModule,
    PreRegistrationsModule,
    SchoolYearsModule,
  ],
})
export class AppModule {}
