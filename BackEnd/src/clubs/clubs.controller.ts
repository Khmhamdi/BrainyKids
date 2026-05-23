import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto } from './dto/club.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('clubs')
export class ClubsController {
  constructor(private readonly service: ClubsService) {}

  // ── Public — liste des clubs d'été actifs (sans auth) ─────────
  @Get('public')
  findPublic(@Query('type') type?: string) {
    return this.service.findAll(type, undefined, true);
  }

  // ── Protégés ──────────────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('type')      type?: string,
    @Query('age_group') ageGroup?: string,
    @Query('active')    active?: string,
  ) {
    return this.service.findAll(type, ageGroup, active === 'true');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateClubDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateClubDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
