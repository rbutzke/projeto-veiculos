import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class CreateAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
  password: string; // Mude de "password_hash" para "password"

  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @IsOptional()
  @IsString()
  role?: string;
}
