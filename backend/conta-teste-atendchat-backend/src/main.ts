import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // 1. Cria a aplicação
  const app = await NestFactory.create(AppModule);

  // 2. Configura o CORS (Antes de qualquer outra coisa)
  app.enableCors({
    origin: '*', // Como é um form público, mantemos o '*'
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    optionsSuccessStatus: 204, // MUITO IMPORTANTE para navegadores modernos
  });

  // 3. Validação global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // 4. Escuta na porta correta e no HOST correto
  const port = process.env.PORT || 3000;
  
  // Forçamos o 0.0.0.0 para o Railway conseguir repassar o tráfego
  await app.listen(port, '0.0.0.0');

  // Log direto (sem usar getUrl para não confundir)
  console.log(`🚀 Servidor pronto na porta ${port} aceitando conexões de 0.0.0.0`);
}

bootstrap().catch(err => {
  console.error("Erro ao subir o servidor:", err);
});