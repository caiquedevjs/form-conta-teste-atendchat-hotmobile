import { IsEmail, IsString, IsNotEmpty, IsNumber, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsNumber()
  accountId: number;

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

  // ESTES CAMPOS SÃO NOVOS E OBRIGATÓRIOS AGORA:
  @IsNotEmpty()
  @IsString()
  empresa: string;

  @IsNotEmpty()
  @IsString()
  telefone: string;
}