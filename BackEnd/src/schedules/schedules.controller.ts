import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Schedules') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('schedules')
export class SchedulesController {
  constructor(private readonly service: SchedulesService) {}
  @Get()        findAll()                              { return this.service.findAll(); }
  @Get(':id')   findOne(@Param('id') id: string)       { return this.service.findOne(id); }
  @Post()       create(@Body() dto: any)               { return this.service.create(dto); }
  @Put(':id')   update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string)       { return this.service.remove(id); }
}
