// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { AuthService } from '../auth.service';
import { CreateAuthDto } from '../dto/createAuth.dto';
import { PG_POOL } from '../../common/database/pg.constants';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let pgPool: Pool;
  let jwtService: JwtService;

  const mockPool = {
    query: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password_hash: 'hashed_password',
    role: 'user',
  };

  const mockUserWithoutPassword = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PG_POOL,
          useValue: mockPool,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    pgPool = module.get<Pool>(PG_POOL);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('deve retornar o usuário sem a senha quando as credenciais forem válidas', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password_hash);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('deve retornar null quando o usuário não for encontrado', async () => {
      // Arrange
      const email = 'notfound@example.com';
      const password = 'password123';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('deve retornar null quando a senha for inválida', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';
      
      mockPool.query.mockResolvedValueOnce({
        rows: [mockUser],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, mockUser.password_hash);
      expect(result).toBeNull();
    });

    it('deve lançar InternalServerErrorException quando ocorrer um erro no banco', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const errorMessage = 'Database error';
      
      mockPool.query.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.validateUser(email, password))
        .rejects
        .toThrow(InternalServerErrorException);

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
    });
  });

  describe('login', () => {
    it('deve retornar token de acesso e informações do usuário', async () => {
      // Arrange
      const mockToken = 'jwt_token';
      const user = mockUserWithoutPassword;
      
      mockJwtService.sign.mockReturnValueOnce(mockToken);

      // Act
      const result = await service.login(user);

      // Assert
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
        role: user.role,
      });
      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    });

    it('deve lançar InternalServerErrorException quando ocorrer um erro', async () => {
      // Arrange
      const user = mockUserWithoutPassword;
      const errorMessage = 'JWT error';
      
      mockJwtService.sign.mockImplementationOnce(() => {
        throw new Error(errorMessage);
      });

      // Act & Assert
      await expect(service.login(user))
        .rejects
        .toThrow(InternalServerErrorException);
    });
  });

  describe('register', () => {
    const createAuthDto: CreateAuthDto = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'user',
    };

    const expectedUserData = {
      email: createAuthDto.email,
      password_hash: 'hashed_password_min',
      name: createAuthDto.name,
      role: createAuthDto.role,
    };

    const mockRegisteredUser = {
      email: createAuthDto.email,
      name: createAuthDto.name,
      role: createAuthDto.role,
    };
    
    it('deve registrar um novo usuário com sucesso', async () => {

      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: [], // Nenhum usuário existente
      });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password_min');
      
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...expectedUserData,
          id: 2,
        }],
      });

      // Act
      const result = await service.register(createAuthDto);

      // Assert
      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockPool.query).toHaveBeenNthCalledWith(
        1,
        'SELECT id FROM users WHERE email = $1',
        [createAuthDto.email]
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(createAuthDto.password, 10);
    expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO users (email, password_hash, name, role)'),
      [expectedUserData.email, 'hashed_password_min', expectedUserData.name, 'user']
    );
      expect(result).toEqual(mockRegisteredUser);
    });

    it('deve usar role "user" como padrão quando não for fornecido', async () => {
      // Arrange
      const createAuthDtoWithoutRole: CreateAuthDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const expectedUserDataWithoutRole = {
        email: createAuthDtoWithoutRole.email,
        password_hash: 'hashed_password_123',
        name: createAuthDtoWithoutRole.name,
        role: 'user',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password_min');
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          ...expectedUserDataWithoutRole,
          id: 3,
        }],
      });

      // Act
      const result = await service.register(createAuthDtoWithoutRole);

      // Assert
      expect(mockPool.query).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO users (email, password_hash, name, role)'),
        [expectedUserDataWithoutRole.email, 'hashed_password_min', expectedUserDataWithoutRole.name, 'user']
      );
      expect(result.role).toBe('user');
    });

    it('deve lançar ConflictException quando o email já estiver em uso', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 1 }], // Usuário já existe
      });

      // Act & Assert
      await expect(service.register(createAuthDto))
        .rejects
        .toThrow(ConflictException);
      
      expect(mockPool.query).toHaveBeenCalledTimes(1);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('deve lançar InternalServerErrorException quando ocorrer erro no hash da senha', async () => {
      // Arrange
      const errorMessage = 'Hash error';
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      (bcrypt.hash as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.register(createAuthDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });

    it('deve lançar InternalServerErrorException quando ocorrer erro no banco de dados', async () => {
      // Arrange
      const errorMessage = 'Database error';
      
      mockPool.query.mockResolvedValueOnce({ rows: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password_123');
      mockPool.query.mockRejectedValueOnce(new Error(errorMessage));

      // Act & Assert
      await expect(service.register(createAuthDto))
        .rejects
        .toThrow(InternalServerErrorException);
    });

    it('deve construir a query dinamicamente com base nos campos fornecidos', async () => {
      // Arrange
      const minimalDto: CreateAuthDto = {
        email: 'minimal@example.com',
        password: 'password123',
        name: 'Minimal User',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_password_min');
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          email: minimalDto.email,
          password_hash: 'hashed_password_min',
          name: minimalDto.name,
          role: 'user',
          id: 4,
        }],
      });

      // Act
      await service.register(minimalDto);

      // Assert
         expect(mockPool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO users (email, password_hash, name, role)'),
      [minimalDto.email, 'hashed_password_min', minimalDto.name, 'user']
      );
    });
  });

  // Testes de integração entre métodos
  describe('fluxo completo', () => {
    it('deve permitir registrar e fazer login com o mesmo usuário', async () => {
      // Mock do registro
      const createAuthDto: CreateAuthDto = {
        email: 'flow@example.com',
        password: 'password123',
        name: 'Flow User',
      };

      mockPool.query.mockResolvedValueOnce({ rows: [] });
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashed_flow_password');
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 5,
          email: createAuthDto.email,
          password_hash: 'hashed_flow_password',
          name: createAuthDto.name,
          role: 'user',
        }],
      });

      // Mock do login
      const registeredUser = await service.register(createAuthDto);
      expect(registeredUser).toBeDefined();

      // Mock do validateUser
      mockPool.query.mockResolvedValueOnce({
        rows: [{
          id: 5,
          email: createAuthDto.email,
          password_hash: 'hashed_flow_password',
          name: createAuthDto.name,
          role: 'user',
        }],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const validatedUser = await service.validateUser(createAuthDto.email, createAuthDto.password);
      expect(validatedUser).toEqual({
        id: 5,
        email: createAuthDto.email,
        name: createAuthDto.name,
        role: 'user',
      });

      // Mock do login
      mockJwtService.sign.mockReturnValueOnce('flow_jwt_token');
      const loginResult = await service.login(validatedUser);
      
      expect(loginResult.access_token).toBe('flow_jwt_token');
      expect(loginResult.user.email).toBe(createAuthDto.email);
    });
  });
});