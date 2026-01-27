import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { createAccountService } from './create.account.service';
import { AccountsController } from './create.account.controller';
import { WhatsappService } from './whatsapp.service';
import { MailService } from './mail.service';
import { TestMailController } from './test.controller';

@Module({
  imports: [HttpModule, ConfigModule], // <--- IMPORTANTE
  controllers: [AccountsController, TestMailController],
  providers: [createAccountService, WhatsappService, MailService],
  exports: [createAccountService], // Exportamos caso outro módulo precise criar contas
})
export class AccountsModule {}
