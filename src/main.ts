import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';
import compression from 'compression';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const loggerService = app.get(LoggerService);
  const port = configService.get('PORT', process.env.PORT || 3001);

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
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global logging interceptor
  app.useGlobalInterceptors(new LoggingInterceptor(loggerService));

  // API prefix
  app.setGlobalPrefix('api', {
    exclude: ['health', '/']
  });

  // Swagger API documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('LIF3 Financial Dashboard API')
      .setDescription('Personal wealth tracking system for Ethan Barnes - Journey to R1.8M net worth')
      .setVersion('1.0')
      .setContact('Ethan Barnes', 'https://43v3r.ai', 'ethan@43v3r.ai')
      .addTag('Financial', 'Financial tracking and goal management')
      .addTag('Business', '43V3R business metrics and revenue tracking')
      .addTag('Auth', 'Authentication and security')
      .addTag('WebSocket', 'Real-time updates and notifications')
      .addTag('Integrations', 'Google Drive, Discord, Claude AI integrations')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'LIF3 API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: '.swagger-ui .topbar { display: none }',
    });
  }

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV'),
      version: '1.0.0',
      service: 'LIF3 Financial Dashboard',
      user: 'Ethan Barnes',
      business: '43V3R',
      netWorthTarget: 'R1,800,000',
      currentProgress: '13.3%'
    });
  });

  // Root endpoint
  app.getHttpAdapter().get('/', (req, res) => {
    res.json({
      message: 'LIF3 Financial Dashboard API',
      user: 'Ethan Barnes',
      business: '43V3R AI Startup',
      goal: 'R1,800,000 net worth',
      currentProgress: '13.3%',
      documentation: '/api/docs',
      health: '/health',
      version: '1.0.0'
    });
  });

  await app.listen(port, '0.0.0.0');

  loggerService.log(`🚀 LIF3 Financial Dashboard API started on port ${port}`, 'Bootstrap');
  loggerService.log(`📊 Target: R239,625 → R1,800,000 (13.3% progress)`, 'Bootstrap');
  loggerService.log(`🏢 43V3R Business: R0 → R4,881 daily target`, 'Bootstrap');
  loggerService.log(`📖 API Documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
  loggerService.log(`💚 Health Check: http://localhost:${port}/health`, 'Bootstrap');
  
  if (configService.get('NODE_ENV') !== 'production') {
    console.log(`
╔══════════════════════════════════════════════════════╗
║              LIF3 Financial Dashboard                ║
║                                                      ║
║  🎯 Goal: R239,625 → R1,800,000 (13.3% progress)    ║
║  🚀 43V3R Daily Target: R4,881                       ║
║  📱 Frontend: http://localhost:3000                  ║
║  🔗 Backend API: http://localhost:${port}              ║
║  📖 Documentation: http://localhost:${port}/api/docs   ║
║  💚 Health: http://localhost:${port}/health            ║
║                                                      ║
║  User: Ethan Barnes <ethan@43v3r.ai>                 ║
║  Business: 43V3R AI Startup                          ║
║  Location: Cape Town, South Africa                   ║
╚══════════════════════════════════════════════════════╝
    `);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start LIF3 Financial Dashboard:', error);
  process.exit(1);
});