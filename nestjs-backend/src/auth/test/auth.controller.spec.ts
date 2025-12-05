// auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { CreateAuthDto } from '../dto/createAuth.dto';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { validateSync } from 'class-validator';

// Mock do AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
};

// Mock do AuthGuard
const mockAuthGuard = {
  canActivate: jest.fn(),
};

// Mock do objeto Request
const mockRequest = {
  user: {
    id: 1,
    email: 'test@example.com',
    name: 'testuser',
  },
};

// Mock do ExecutionContext
const mockExecutionContext: Partial<ExecutionContext> = {
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue(mockRequest),
    getResponse: jest.fn(),
    getNext: jest.fn(),
  }),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(AuthGuard('local'))
      .useValue(mockAuthGuard)
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve chamar authService.register com os dados corretos', async () => {
      // Arrange
      const createUserDto: CreateAuthDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
      };

      const expectedResult = {
        id: 1,
        email: 'test@example.com',
        name: 'testuser',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.register(createUserDto);

      // Assert
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedResult);
    });

    it('deve lidar com erro no registro', async () => {
      // Arrange
      const createUserDto: CreateAuthDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'testuser',
      };

      const error = new Error('Falha no registro');
      mockAuthService.register.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.register(createUserDto)).rejects.toThrow(
        'Falha no registro',
      );
    });
  });

  describe('login', () => {
    it('deve chamar authService.login com o usuário da request', async () => {
      // Arrange
      const mockReq = { user: mockRequest.user };
      const expectedToken = {
        access_token: 'mock-jwt-token',
      };

      mockAuthService.login.mockResolvedValue(expectedToken);

      // Act
      const result = await controller.login(mockReq);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(mockReq.user);
      expect(result).toEqual(expectedToken);
    });

    it('deve apresentar erro se authService.login falhar', async () => {
      // Arrange
      const mockReq = { user: mockRequest.user };
      const error = new Error('Falha no Login');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(mockReq)).rejects.toThrow('Falha no Login');
    });
  });

  describe('validate', () => {
    it('deve retornar o usuário da request quando autenticado', async () => {
      // Arrange
      const mockReq = { user: mockRequest.user };

      // Act
      const result = await controller.validate(mockReq);

      // Assert
      expect(result).toEqual(mockRequest.user);
    });

    it('deve retornar usuário diferente quando request tiver usuário diferente', async () => {
      // Arrange
      const differentUser = {
        id: 2,
        email: 'other@example.com',
        name: 'otheruser',
      };
      const mockReq = { user: differentUser };

      // Act
      const result = await controller.validate(mockReq);

      // Assert
      expect(result).toEqual(differentUser);
      expect(result.id).toBe(2);
    });
  });

  // Testes para os guards
  describe('Guards', () => {
    it('deve usar AuthGuard local no login', () => {
      // Podemos testar isso verificando se o decorador está presente
      // ou criando uma instância e testando o comportamento
      const metadata = Reflect.getMetadata('__guards__', AuthController.prototype.login);
      expect(metadata).toBeDefined();
    });

    it('deve usar AuthGuard jwt no validate', () => {
      const metadata = Reflect.getMetadata('__guards__', AuthController.prototype.validate);
      expect(metadata).toBeDefined();
    });
  });
});

// Testes para os DTOs 
describe('CreateUserDto', () => {
  it('deve criar um DTO válido', () => {
    const dto = new CreateAuthDto();
    dto.email = 'test@example.com';
    dto.password = 'password123';
    dto.name = 'testuser';

    expect(dto.email).toBe('test@example.com');
    expect(dto.password).toBe('password123');
    expect(dto.name).toBe('testuser');
  });

  it('deve validar email correto', () => {
    // Se você usar class-validator, pode testar as validações aqui
    const dto = new CreateAuthDto();
    dto.email = 'invalid-email'; // Email inválido
    
    // Exemplo de validação (se estiver usando class-validator)
    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});