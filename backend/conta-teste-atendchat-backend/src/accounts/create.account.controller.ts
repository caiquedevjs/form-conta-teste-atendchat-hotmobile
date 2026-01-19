/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Controller, Post, Body } from '@nestjs/common';
import { CreateAccountDto } from './dto/create.account.dto';
import { createAccountService } from './create.account.service';
import { CreateUserDto } from './dto/create.user.dto';

@Controller('account')
export class AccountsController {
  constructor(private readonly accountsService: createAccountService) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createChatWhootAccount(createAccountDto);
  }

  @Post('user')
  async createUser(@Body() createUserDto: CreateUserDto) {
    // PASSANDO OS 3 ARGUMENTOS EXIGIDOS PELO SERVICE:
    // 1. O DTO completo
    // 2. A empresa (para o e-mail/whats)
    // 3. O telefone (para o whats)
    return this.accountsService.createChatwootUser(
      createUserDto, 
      createUserDto.empresa, 
      createUserDto.telefone
    );
  }
}