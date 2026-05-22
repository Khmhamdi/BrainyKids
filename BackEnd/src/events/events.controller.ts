import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@ApiTags('Événements') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
