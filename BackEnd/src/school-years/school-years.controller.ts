import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchoolYearsService } from './school-years.service';

@Controller('school-years')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SchoolYearsController {
  constructor(private service: SchoolYearsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('current')
  findCurrent() {
    return this.service.findCurrent();
  }

  @Post()
  create(@Body() data: { label: string; start_date: string; end_date: string }) {
    return this.service.create(data);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() data: { label?: string; start_date?: string; end_date?: string; is_active?: boolean },
  ) {
    return this.service.update(id, data);
  }

  @Put(':id/set-current')
  setCurrent(@Param('id') id: string) {
    return this.service.setCurrent(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
