import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@ApiTags('Paiements') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}
  @Get() findAll(@Query('page') p = '1', @Query('limit') l = '20', @Query('status') s?: string) { return this.service.findAll(+p, +l, s); }
  @Get('treasury') getTreasury() { return this.service.getTreasuryStats(); }
  @Get('student/:id') findByStudent(@Param('id') id: string) { return this.service.findByStudent(id); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Put(':id/status') updateStatus(@Param('id') id: string, @Body() body: { status: string }) { return this.service.updateStatus(id, body.status); }
}
