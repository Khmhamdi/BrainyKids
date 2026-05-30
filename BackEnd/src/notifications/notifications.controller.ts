import { Controller, Get, Put, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

// Types réservés à l'administration — jamais visibles aux enseignantes
const ADMIN_ONLY_TYPES = ['overdue', 'dossier', 'pre_registration'];

@Controller('notifications') @UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  findAll(@Request() req: any) {
    const userId = req.user.sub;
    const role   = req.user.role;
    const excludeTypes = role === 'teacher' ? ADMIN_ONLY_TYPES : [];
    return this.service.findByUser(userId, excludeTypes);
  }

  @Get('unread-count')
  unreadCount(@Request() req: any) {
    const userId = req.user.sub;
    const role   = req.user.role;
    const excludeTypes = role === 'teacher' ? ADMIN_ONLY_TYPES : [];
    return this.service.countUnread(userId, excludeTypes);
  }

  @Put(':id/read')
  markRead(@Param('id') id: string) { return this.service.markRead(id); }

  @Put('read-all')
  markAllRead(@Request() req: any)  { return this.service.markAllRead(req.user.sub); }
}
