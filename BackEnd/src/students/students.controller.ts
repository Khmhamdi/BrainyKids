import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Students') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Get()
  findAll(
    @Query('page') p = '1',
    @Query('limit') l = '10',
    @Query('search') s = '',
    @Query('archived') archived = 'false',
    @Query('classId') classId?: string,
    @Query('schoolYear') schoolYear?: string,
  ) {
    return this.service.findAll(+p, +l, s, archived === 'true', classId, schoolYear);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Post()
  create(@Body() dto: any) { return this.service.create(dto); }

  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: any) { return this.service.update(id, dto); }

  // ── Archiver
  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id/archive')
  archive(@Param('id') id: string, @Request() req: any) {
    return this.service.archive(id, req.user.sub);
  }

  // ── Restaurer
  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id/restore')
  restore(@Param('id') id: string) { return this.service.restore(id); }

  // ── Suppression définitive
  @UseGuards(RolesGuard) @Roles('administrator')
  @Put(':id/unregister')
  unregister(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.service.unregister(id, body.reason);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }

  // ── Lier un parent
  @UseGuards(RolesGuard) @Roles('administrator')
  @Post(':id/parents')
  linkParent(
    @Param('id') studentId: string,
    @Body() body: { parent_id: string; relationship: string },
  ) {
    return this.service.linkParent(studentId, body.parent_id, body.relationship);
  }

  // ── Délier un parent
  @UseGuards(RolesGuard) @Roles('administrator')
  @Delete(':id/parents/:parentId')
  unlinkParent(@Param('id') sId: string, @Param('parentId') pId: string) {
    return this.service.unlinkParent(sId, pId);
  }
}
