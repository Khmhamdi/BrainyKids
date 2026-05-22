import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications') @UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}
  @Get()       findAll(@Request() req: any)   { return this.service.findByUser(req.user.id); }
  @Get('unread-count') unreadCount(@Request() req: any) { return this.service.countUnread(req.user.id); }
  @Put(':id/read')    markRead(@Param('id') id: string) { return this.service.markRead(id); }
  @Put('read-all')    markAllRead(@Request() req: any)  { return this.service.markAllRead(req.user.id); }
}
