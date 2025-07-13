import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { LoggerService } from '../src/common/logger/logger.service';
import compression from 'compression';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

let app: any;

async function createApp() {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    const configService = app.get(ConfigService);
    const loggerService = app.get(LoggerService);

    // Security middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", 'ws:', 'wss:'],
        },
      },
    }));

    // Compression
    app.use(compression());

    // CORS configuration
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://l1f3-frontend-htoz.vercel.app',
        'https://lif3-frontend.vercel.app',
        'https://frontend-c1au4gdis-43v3r.vercel.app',
        'https://l1f3-frontend-kmhg.vercel.app',
        configService.get('FRONTEND_URL', 'http://localhost:3000')
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    // Global logging interceptor
    app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

    await app.init();
  }
  return app;
}

export default async function handler(req: any, res: any) {
  const app = await createApp();
  return app.getHttpAdapter().getInstance()(req, res);
}