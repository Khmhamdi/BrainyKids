import { Module } from '@nestjs/common';
import { SchoolYearsController } from './school-years.controller';
import { SchoolYearsService } from './school-years.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SchoolYearsController],
  providers: [SchoolYearsService, PrismaService],
  exports: [SchoolYearsService],
})
export class SchoolYearsModule {}
