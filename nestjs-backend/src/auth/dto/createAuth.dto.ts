import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@exemplo.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
  
  @ApiProperty({
    description: 'Senha utilizada para login',
    example: '#1Abcdef'
  })
  @IsNotEmpty()
  @IsStrongPassword({minLength: 8,minLowercase: 1,minUppercase: 1,minNumbers: 1,minSymbols: 0,},
  {
    message:
        'O password deve conter ao menos 1 character maisculo, 1 minusculo, 1 simbolo e 1 numero e ter pelo menos 8 characteres',
  },
  )
  password: string; 
  
  @ApiProperty({
    description: 'O Nome é utilizado para casdastro',
    example: 'Joao da Silva'
  })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Perfil do Usuário',
    example: 'admin, user, manager',
    required: false,
  })
  
  @IsOptional()
  @IsString()
  role?: string;
}
