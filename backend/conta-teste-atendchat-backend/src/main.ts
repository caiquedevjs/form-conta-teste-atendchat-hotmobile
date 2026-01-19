import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    optionsSuccessStatus: 204,
  });

  const port = process.env.PORT || 3000;
  
  // Forçamos o binding em 0.0.0.0
  await app.listen(port, '0.0.0.0');

  // Log MANUAL para confirmar que o novo código subiu
  console.log(`🚀 SERVIDOR EXECUTANDO EM 0.0.0.0 NA PORTA ${port}`);
  console.log(`📅 HORA DO DEPLOY: ${new Date().toLocaleString()}`);
}
bootstrap().catch(err => console.error("Erro no boot:", err));