import { NestFactory } from '@nestjs/core';
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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
}

bootstrap();
