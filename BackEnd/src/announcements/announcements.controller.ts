import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@ApiTags('Annonces') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() dto: any) { return this.service.create(dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
