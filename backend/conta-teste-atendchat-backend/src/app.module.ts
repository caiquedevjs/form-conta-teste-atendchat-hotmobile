import { Module } from '@nestjs/common';
import { AccountsModule } from './accounts/account.module';

@Module({
  imports: [AccountsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
