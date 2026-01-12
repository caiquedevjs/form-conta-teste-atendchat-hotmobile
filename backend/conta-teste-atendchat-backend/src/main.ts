import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validação global (já havíamos configurado)
  app.useGlobalPipes(new ValidationPipe());

  // 2. ATIVANDO O CORS AQUI
// 2. CORREÇÃO DO CORS
 app.enableCors({
    origin: '*',            // Aceita qualquer site (Vercel, Localhost, etc)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: false,     // <--- IMPORTANTE: Tem que ser false quando usa '*'
  });
  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
