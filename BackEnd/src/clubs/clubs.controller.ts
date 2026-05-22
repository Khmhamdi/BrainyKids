import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { CreateClubDto, UpdateClubDto } from './dto/club.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clubs')
export class ClubsController {
  constructor(private readonly service: ClubsService) {}

  @Get()
  findAll(
    @Query('type')      type?: string,
    @Query('age_group') ageGroup?: string,
    @Query('active')    active?: string,
  ) {
    return this.service.findAll(type, ageGroup, active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClubDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClubDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
