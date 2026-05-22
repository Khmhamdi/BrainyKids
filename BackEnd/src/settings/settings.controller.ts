import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateLookupDto, UpdateLookupDto } from './dto/lookup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('settings/lookups')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // GET /api/settings/lookups  — all, or filtered by ?category=regime
  @Get()
  findAll(@Query('category') category?: string, @Query('active') active?: string) {
    if (category) return this.service.findByCategory(category, active === 'true');
    return this.service.findAllCategories();
  }

  @Post()
  create(@Body() dto: CreateLookupDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLookupDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
