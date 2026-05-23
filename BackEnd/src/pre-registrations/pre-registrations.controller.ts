import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PreRegistrationsService } from './pre-registrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Pre-inscriptions')
@Controller('pre-registrations')
export class PreRegistrationsController {
  constructor(private readonly service: PreRegistrationsService) {}

  // ── Public — sans authentification ───────────────────────────
  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  // ── Admin — authentification requise ─────────────────────────
  @Get()
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  findAll(@Query('status') status?: string) {
    return this.service.findAll(status);
  }

  @Get('stats')
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  stats() {
    return this.service.stats();
  }

  @Put(':id/approve')
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  approve(@Param('id') id: string, @Request() req: any) {
    return this.service.approve(id, req.user?.username || 'admin');
  }

  @Put(':id/reject')
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  reject(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.service.reject(id, req.user?.username || 'admin', reason || '');
  }

  @Delete(':id')
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
