import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PacksService } from './packs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Packs Financiers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('packs')
export class PacksController {
  constructor(private readonly service: PacksService) {}

  // ── Pack année scolaire ──────────────────────────────────────
  @Post('student/:id')
  upsertPack(@Param('id') id: string, @Body() dto: any) {
    return this.service.upsertPack(id, dto);
  }

  @Get('student/:id')
  getPack(@Param('id') id: string) {
    return this.service.getPack(id);
  }

  @Get('student/:id/payments')
  getPayments(@Param('id') id: string) {
    return this.service.getPaymentsByStudent(id);
  }

  // ── Paiement mensuel en un clic ──────────────────────────────
  @Put('student/:id/pay-month')
  markMonthPaid(
    @Param('id') id: string,
    @Body() body: { month: number; year: number },
  ) {
    return this.service.markMonthPaid(id, body.month, body.year);
  }

  // ── Paiement individuel ──────────────────────────────────────
  @Put('payment/:id/pay')
  markPaid(@Param('id') id: string) {
    return this.service.markPaid(id);
  }

  @Delete('payment/:id')
  deletePayment(@Param('id') id: string) {
    return this.service.deletePayment(id);
  }

  // ── Vérifier les retards ─────────────────────────────────────
  @Post('check-overdue')
  checkOverdue() {
    return this.service.checkOverduePayments();
  }

  // ── Vérifier les dossiers incomplets ─────────────────────────
  @Post('check-dossiers')
  checkDossiers() {
    return this.service.checkMissingDossiers();
  }

  // ── Clubs d'été ──────────────────────────────────────────────
  @Post('summer')
  createSummerPack(@Body() dto: any) {
    return this.service.createSummerPack(dto);
  }

  @Get('summer')
  getSummerPacks(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.service.getSummerPacks(month ? +month : undefined, year ? +year : undefined);
  }

  @Put('summer/:id/pay')
  markSummerPaid(@Param('id') id: string) {
    return this.service.markSummerPackPaid(id);
  }

  // ── Élèves externes ──────────────────────────────────────────
  @Post('external-students')
  createExternal(@Body() dto: any) {
    return this.service.createExternalStudent(dto);
  }

  @Get('external-students')
  getExternals() {
    return this.service.getExternalStudents();
  }
}
