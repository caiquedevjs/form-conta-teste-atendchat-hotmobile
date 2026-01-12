import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validação global (já havíamos configurado)
  app.useGlobalPipes(new ValidationPipe());

  // 2. ATIVANDO O CORS AQUI
  app.enableCors({
    // Permite apenas o seu Frontend (Vite geralmente roda na 5173)
    origin: '*',

    // Métodos permitidos
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',

    // Permite enviar cookies/headers de autorização se precisar no futuro
    credentials: true,
  });

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
