import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Parents') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('parents')
export class ParentsController {
  constructor(private readonly service: ParentsService) {}

  @Get('me')
  getMyProfile(@Request() req: any) { return this.service.findByUserId(req.user.sub); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Get()
  findAll(
    @Query('page') p = '1',
    @Query('limit') l = '10',
    @Query('search') s = '',
    @Query('archived') archived = 'false',
  ) {
    return this.service.findAll(+p, +l, s, archived === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Get('family/list')
  listFamilyAccounts() {
    return this.service.listFamilyAccounts();
  }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Get('family/:username')
  findFamily(@Param('username') username: string) {
    return this.service.findFamilyAccount(username);
  }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id/archive')
  archive(@Param('id') id: string, @Request() req: any) {
    return this.service.archive(id, req.user.sub);
  }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id/restore')
  restore(@Param('id') id: string) { return this.service.restore(id); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
