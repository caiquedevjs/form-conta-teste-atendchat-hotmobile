import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Validação global (já havíamos configurado)
  app.useGlobalPipes(new ValidationPipe());

  // 2. ATIVANDO O CORS AQUI
app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    
  });
  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
