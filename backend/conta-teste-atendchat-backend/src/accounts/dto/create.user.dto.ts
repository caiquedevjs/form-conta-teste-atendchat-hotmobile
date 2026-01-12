/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty, IsString, MinLength, IsNumber } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  accountId: number; // <--- NOVO CAMPO OBRIGATÓRIO

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}