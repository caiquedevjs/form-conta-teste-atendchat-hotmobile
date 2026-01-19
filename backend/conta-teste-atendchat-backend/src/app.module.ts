/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/account.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // Força o caminho do arquivo (opcional, mas ajuda)
    }),
    AccountsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
