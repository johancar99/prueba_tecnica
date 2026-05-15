import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger — disponible en /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sistema de Prescripciones Médicas')
    .setDescription(
      `API REST para la gestión de prescripciones médicas.\n\n` +
      `**Cuentas de prueba:**\n` +
      `| Rol | Email | Contraseña |\n` +
      `|-----|-------|------------|\n` +
      `| Admin | admin@clinica.com | Admin123! |\n` +
      `| Doctor | doctor@clinica.com | Doctor123! |\n` +
      `| Paciente | paciente@clinica.com | Patient123! |\n\n` +
      `Para autenticarte: ejecuta **POST /auth/login** → copia el \`accessToken\` → haz clic en **Authorize** (🔒) y pégalo.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Pega aquí el accessToken obtenido en /auth/login',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Helmet después de Swagger para no romper el CDN de Swagger UI
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `'unsafe-inline'`],
        },
      },
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}/api`);
  console.log(`Swagger docs:          http://localhost:${port}/api/docs`);
}

bootstrap();
