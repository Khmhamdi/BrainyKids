import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Personnel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly service: TeachersService) {}

  @Get()
  findAll(
    @Query('page')     p = '1',
    @Query('limit')    l = '10',
    @Query('search')   s = '',
    @Query('fonction') f?: string,
  ) {
    return this.service.findAll(+p, +l, s, f);
  }

  @Get('me')
  findMe(@Request() req: any) {
    return this.service.findByUserId(req.user.sub);
  }

  // ── Salaires — routes statiques avant :id ────────────────────
  @Get('salary-payments/all')
  getAllSalaryPayments(
    @Query('month')     month?: string,
    @Query('year')      year?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status')    status?: string,
  ) {
    return this.service.getAllSalaryPayments({ month, year, teacherId, status });
  }

  @Put('salary-payments/:paymentId/pay')
  markSalaryPaid(@Param('paymentId') paymentId: string) {
    return this.service.markSalaryPaid(paymentId);
  }

  @Delete('salary-payments/:paymentId')
  deleteSalaryPayment(@Param('paymentId') paymentId: string) {
    return this.service.deleteSalaryPayment(paymentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/salary-payments')
  getSalaryPayments(@Param('id') id: string) {
    return this.service.getSalaryPayments(id);
  }

  @Post(':id/salary-payments')
  recordSalaryPayment(@Param('id') id: string, @Body() dto: any) {
    return this.service.recordSalaryPayment(id, dto);
  }

  // ── Pack annuel de salaire ────────────────────────────────────
  @Post(':id/salary-pack')
  createSalaryPack(@Param('id') id: string, @Body() dto: any) {
    return this.service.createSalaryPack(id, dto);
  }
}
