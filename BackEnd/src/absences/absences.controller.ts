import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AbsencesService } from './absences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Absences') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('absences')
export class AbsencesController {
  constructor(private readonly service: AbsencesService) {}

  @Get()
  findAll(@Query('page') p = '1', @Query('limit') l = '20') {
    return this.service.findAll(+p, +l);
  }

  @Get('class/:classId/date/:date')
  findByClassAndDate(@Param('classId') classId: string, @Param('date') date: string) {
    return this.service.findByClassAndDate(classId, date);
  }

  @Get('student/:id')
  findByStudent(@Param('id') id: string) {
    return this.service.findByStudent(id);
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
}
