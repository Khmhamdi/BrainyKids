import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Créer le dossier uploads s'il n'existe pas
  const uploadsDir = join(process.cwd(), 'uploads', 'photos');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  // Servir les fichiers uploadés (photos) comme statiques
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  // Sécurité
  app.use(helmet());

  // CORS — FRONTEND_URL accepte plusieurs origines séparées par ","
  // ex: FRONTEND_URL=http://192.168.1.100,http://brainykids.duckdns.org
  const envOrigins = (process.env.FRONTEND_URL || '')
    .split(',').map(o => o.trim()).filter(Boolean);

  const allowedOrigins = Array.from(new Set([
    ...envOrigins,
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:3001',
  ]));

  app.enableCors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (Postman, curl, SSR Next.js)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS bloqué pour l'origine: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation globale
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Préfixe API
  app.setGlobalPrefix('api');

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Brainy Kids API')
    .setDescription("API de gestion du jardin d'enfants Brainy Kids")
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ── Health check (utilisé par Docker healthcheck) ──────────
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Brainy Kids API lancée sur le port ${port}`);
  console.log(`📚 Documentation Swagger : http://localhost:${port}/api/docs`);
}
bootstrap();
