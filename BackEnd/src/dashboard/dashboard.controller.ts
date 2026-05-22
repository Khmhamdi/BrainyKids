import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Dashboard') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('dashboard')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() { return this.service.getStats(); }

  @Get('gender-stats')
  getGenderStats() { return this.service.getGenderStats(); }

  @Get('attendance-chart')
  getAttendance() { return this.service.getAttendanceChart(); }
}
