import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../common/database/pg.constants';
import { CreateAuthDto } from './dto/createAuth.dto';
import { AuthEntity } from './entities/auth.entity';

@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly pgPool: Pool,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
   try { 
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pgPool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;

    return userWithoutPassword;

    } catch (error) {
      throw new InternalServerErrorException(`Erro ao validar usuário: ${error.message}`);
    }  
  }

  async login(user: any) {
    try {
    const payload = { 
      email: user.email, 
      sub: user.id,
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
    } catch (error) {
      throw new InternalServerErrorException(`Erro ao efetuar login: ${error.message}`);
    }
  }

  async register(createAuthDto: CreateAuthDto) : Promise<AuthEntity> {
   try {  

       // Verificar se o usuário já existe
      const existUser = await this.pgPool.query(
        'SELECT id FROM users WHERE email = $1',
        [createAuthDto.email]
      );

      if (existUser.rows.length > 0) {
        throw new ConflictException(`Email: ${createAuthDto.email} já está em uso`);
      }
    
      const hashedPassword = await bcrypt.hash(createAuthDto.password, 10);
            
      const userData = {
        email: createAuthDto.email,
        password_hash: hashedPassword, 
        name: createAuthDto.name,
        role: createAuthDto.role || 'user'
      }; 
      
      //Extrai as chaves do objeto DTO (colunas)
      const columns = Object.keys(userData);
      //Extrai os valores do objeto DTO (valores a serem inseridos)
      const values = Object.values(userData);
      //Gera os placeholders parametrizados (e.g., "$1, $2, $3")
      //O driver pg usa $N para prevenir SQL Injection.
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

            //Monta a string SQL dinamicamente
      const queryText = `
        INSERT INTO users (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;
      // Executa a query com os valores parametrizados
      const res = await this.pgPool.query(queryText, values);

      // Retorna o primeiro registro inserido, agora tipado 
      return {
        email: res.rows[0].email,
        name: res.rows[0].name,
        role: res.rows[0].role
      } as AuthEntity; // Usa um type assertion para garantir o tipo retornado

      } catch (error) {
        if (error instanceof ConflictException) {
           throw error;
      }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro ao criar Veículo: ${errorMessage}`);
      }
  
  }
}
