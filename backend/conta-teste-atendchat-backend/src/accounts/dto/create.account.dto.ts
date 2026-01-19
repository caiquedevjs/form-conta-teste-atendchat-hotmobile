/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty({ message: 'O nome da empresa é obrigatório ' })
  @IsString()
  empresa: string;

  @IsNotEmpty({ message: 'O mail da empresa é obrigatório' })
  @IsEmail()
  mail: string;

  @IsOptional()
  @IsString()
  responsavel?: string;

  @IsOptional()
  @IsString()
  telefone?: string;

  @IsOptional()
  @IsString()
  celular?: string;

  @IsOptional()
  @IsNumber()
  LimitAgents: number;

  @IsOptional()
  @IsNumber()
  LimitInboxes: number;
}
