import { Controller, Post, Body } from '@nestjs/common';
import { CreateAccountDto } from './dto/create.account.dto';
import { createAccountService } from './create.account.service';

@Controller('account')
export class AccountsController {
  constructor(private readonly accountsService: createAccountService) {}

  @Post()
  async create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createChatWhootAccount(createAccountDto);
  }
}