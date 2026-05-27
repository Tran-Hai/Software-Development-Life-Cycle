import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { PrismaService } from './database/prisma/prisma.service';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  // Auto-run database push on startup
  if (nodeEnv === 'production') {
    const prisma = app.get(PrismaService);
    try {
      await prisma.$executeRawUnsafe('SELECT 1');
      console.log('✅ Database connected');
    } catch (err) {
      console.error('❌ Database connection failed:', err);
      process.exit(1);
    }
  }

  app.setGlobalPrefix('api/v1');

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor(), new TimeoutInterceptor());

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());

  app.enableCors({
    origin: [frontendUrl, ...(nodeEnv === 'production' ? [] : ['http://localhost:3000'])],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve frontend build from the same server (single-service deployment)
  const nextStaticDir = join(process.cwd(), 'packages', 'frontend', '.next', 'static');
  const nextServerDir = join(process.cwd(), 'packages', 'frontend', '.next', 'server', 'app');
  const frontendBuilt = existsSync(nextServerDir);

  if (frontendBuilt) {
    // Serve Next.js static assets (before NestJS router for efficiency)
    if (existsSync(nextStaticDir)) {
      app.use(
        '/_next/static',
        express.static(nextStaticDir, {
          maxAge: '1y',
          immutable: true,
        }),
      );
    }

    // Catch-all middleware for frontend routes (runs before NestJS router)
    app.use((req: any, res: any, next: any) => {
      // Let NestJS handle API routes
      if (req.path.startsWith('/api')) {
        return next();
      }

      // Let engine.io handle Socket.IO requests directly (not via Express)
      if (req.path.startsWith('/socket.io')) {
        return;
      }

      // Skip Next.js internal routes (already handled by static middleware)
      if (req.path.startsWith('/_next/')) {
        return next();
      }

      // Map URL to a specific pre-rendered HTML page
      const pagePath: string =
        req.path === '/' ? 'index' : req.path.replace(/^\/+/, '').replace(/\/+$/, '');
      const htmlFile = join(nextServerDir, pagePath + '.html');

      if (existsSync(htmlFile)) {
        res.setHeader('Cache-Control', 'no-cache');
        return res.sendFile(htmlFile);
      }

      // SPA fallback for dynamic routes (e.g., /projects/[projectId]/...)
      const fallback = join(nextServerDir, 'index.html');
      if (existsSync(fallback)) {
        return res.sendFile(fallback);
      }

      next();
    });
  }

  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
