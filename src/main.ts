import './dns-bootstrap';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', true);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors: Record<string, string> = {};
        errors.forEach((err) => {
          if (err.constraints) {
            formattedErrors[err.property] = Object.values(err.constraints)[0];
          }
        });
        return new BadRequestException({
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    })
  );
  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
