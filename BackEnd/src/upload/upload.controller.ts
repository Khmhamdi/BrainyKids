import {
  Controller, Post, UseInterceptors, UploadedFile,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Express } from 'express';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {

  @Post('photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: join(process.cwd(), 'uploads', 'photos'),
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.match(/^image\//)) {
        return cb(new BadRequestException('Seules les images sont acceptées'), false);
      }
      cb(null, true);
    },
  }))
  uploadPhoto(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    // Retourner l'URL publique accessible via nginx
    const url = `/uploads/photos/${file.filename}`;
    return { url, filename: file.filename, size: file.size };
  }
}
