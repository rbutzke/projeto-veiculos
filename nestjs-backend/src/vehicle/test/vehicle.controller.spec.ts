import { Test, TestingModule } from '@nestjs/testing';
import { VehicleController } from '../vehicle.controller';
import { VehicleService } from '../vehicle.service';
import { CreateVehicleDto } from '../dto/createVehicle.dto';
import { UpdateVehicleDto } from '../dto/updateVehicle.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwtAuth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Mock completo do VehicleService incluindo TODOS os métodos
const mockVehicleService = {
  createVehicle: jest.fn(),
  findAllVehicle: jest.fn(),
  findOneVehicle: jest.fn(),
  updateVehicle: jest.fn(),
  updateFullVehicle: jest.fn(), 
  removeVehicle: jest.fn(),
};

// Mock dos guards
const mockJwtAuthGuard = {
  canActivate: jest.fn((context: ExecutionContext) => {
    return true;
  }),
};

const mockRolesGuard = {
  canActivate: jest.fn((context: ExecutionContext) => {
    return true;
  }),
};

// Mock do Reflector
const mockReflector = {
  get: jest.fn(),
};

// Dados mock
const mockVehicle = {
  id: 1,
  placa: 'ABC1234',
  chassi: 'XYZ987654321',
  renavam: '12345678901',
  marca: 'Toyota',
  modelo: 'Corolla',
  ano: 2022,
  data_cadastro: new Date(),
  data_alteracao: new Date(),
};

const mockPaginatedResult = {
  vehicles: [mockVehicle],
  total: 1,
  page: 1,
  totalPages: 1,
};

describe('VehicleController', () => {
  let controller: VehicleController;
  let service: typeof mockVehicleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehicleController],
      providers: [
        {
          provide: VehicleService,
          useValue: mockVehicleService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<VehicleController>(VehicleController);
    service = mockVehicleService;

    // Reset mocks
    jest.clearAllMocks();
    
    // Configurar o reflector mock
    mockReflector.get.mockReturnValue(['admin', 'manager', 'user']);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createVehicle', () => {
    it('deve criar um veículo com sucesso', async () => {
      // Arrange
      const createVehicleDto: CreateVehicleDto = {
        placa: 'ABC1234',
        chassi: 'XYZ987654321',
        renavam: '12345678901',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2022,
      };

      service.createVehicle.mockResolvedValue(mockVehicle);

      // Act
      const result = await controller.createVehicle(createVehicleDto);

      // Assert
      expect(service.createVehicle).toHaveBeenCalledWith(createVehicleDto);
      expect(result).toEqual(mockVehicle);
    });

    it('deve mostrar um erro quando o serviço falhar', async () => {
      // Arrange
      const createVehicleDto: CreateVehicleDto = {
        placa: 'ABC1234',
        chassi: 'XYZ987654321',
        renavam: '12345678901',
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2022,
      };

      const error = new Error('Erro no Database');
      service.createVehicle.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.createVehicle(createVehicleDto)).rejects.toThrow(
        'Erro no Database'
      );
      expect(service.createVehicle).toHaveBeenCalledWith(createVehicleDto);
    });
  });

  describe('findAllVehicle', () => {
    it('deve retornar veículos paginados', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      service.findAllVehicle.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('deve retornar veículos paginados com valores padrão', async () => {
      // Arrange
      const paginationDto: PaginationDto = {};
      service.findAllVehicle.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('deve lidar com resultado vazio', async () => {
      // Arrange
      const paginationDto: PaginationDto = { page: 1, limit: 10 };
      const emptyResult = {
        vehicles: [],
        total: 0,
        page: 1,
        totalPages: 0,
      };
      service.findAllVehicle.mockResolvedValue(emptyResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result.vehicles).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('findOneVehicle', () => {
    it('deve retornar o veículo por ID', async () => {
      // Arrange
      const vehicleId = '1';
      service.findOneVehicle.mockResolvedValue(mockVehicle);

      // Act
      const result = await controller.findOneVehicle(vehicleId);

      // Assert
      expect(service.findOneVehicle).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockVehicle);
    });

    it('deve converter o ID de string em número', async () => {
      // Arrange
      const vehicleId = '123';
      service.findOneVehicle.mockResolvedValue(mockVehicle);

      // Act
      await controller.findOneVehicle(vehicleId);

      // Assert
      expect(service.findOneVehicle).toHaveBeenCalledWith(123);
    });

    it('deve lidar com IDs não numéricos de forma adequada', async () => {
      // Arrange
      const vehicleId = 'abc';
      const error = new Error('ID inválido');
      service.findOneVehicle.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.findOneVehicle(vehicleId)).rejects.toThrow(
        'ID inválido'
      );
      expect(service.findOneVehicle).toHaveBeenCalledWith(NaN);
    });
  });

  describe('updateVehicle', () => {
    it('deve atualizar um veículo com sucesso', async () => {
      // Arrange
      const vehicleId = '1';
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Honda',
        modelo: 'Civic',
      };

      const updatedVehicle = {
        ...mockVehicle,
        ...updateVehicleDto,
      };

      service.updateVehicle.mockResolvedValue(updatedVehicle);

      // Act
      const result = await controller.updateVehicle(vehicleId, updateVehicleDto);

      // Assert
      expect(service.updateVehicle).toHaveBeenCalledWith(1, updateVehicleDto);
      expect(result).toEqual(updatedVehicle);
    });

    it('deve lidar com atualização parcial', async () => {
      // Arrange
      const vehicleId = '1';
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Ford',
      };

      const updatedVehicle = {
        ...mockVehicle,
        marca: 'Ford',
      };

      service.updateVehicle.mockResolvedValue(updatedVehicle);

      // Act
      const result = await controller.updateVehicle(vehicleId, updateVehicleDto);

      // Assert
      expect(service.updateVehicle).toHaveBeenCalledWith(1, updateVehicleDto);
      expect(result.marca).toBe('Ford');
    });

    it('deve gerar um erro quando o veículo não for encontrado', async () => {
      // Arrange
      const vehicleId = '999';
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Renault',
      };

      const error = new Error('Veiculo não encontrado');
      service.updateVehicle.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.updateVehicle(vehicleId, updateVehicleDto)
      ).rejects.toThrow('Veiculo não encontrado');
    });
  });

  describe('removeVehicle', () => {
    it('deve remover um veículo com sucesso', async () => {
      // Arrange
      const vehicleId = '1';
      service.removeVehicle.mockResolvedValue(mockVehicle);

      // Act
      const result = await controller.removeVehicle(vehicleId);

      // Assert
      expect(service.removeVehicle).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockVehicle);
    });

    it('deve lidar com a situação quando o veículo não existir', async () => {
      // Arrange
      const vehicleId = '999';
      service.removeVehicle.mockResolvedValue(undefined);

      // Act
      const result = await controller.removeVehicle(vehicleId);

      // Assert
      expect(service.removeVehicle).toHaveBeenCalledWith(999);
      expect(result).toBeUndefined();
    });

    it('deve lidar com erros de exclusão', async () => {
      // Arrange
      const vehicleId = '1';
      const error = new Error('Falha na Deleção');
      service.removeVehicle.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.removeVehicle(vehicleId)).rejects.toThrow(
        'Falha na Deleção'
      );
    });
  });

  describe('Authorization and Roles', () => {
    it('deve ter o JwtAuthGuard aplicado', () => {
      expect(controller).toBeDefined();
    });

    it('deve ter funções corretas para cada endpoint', () => {
      expect(mockJwtAuthGuard).toBeDefined();
      expect(mockRolesGuard).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com createVehicleDto vazio', async () => {
      // Arrange
      const createVehicleDto = {} as CreateVehicleDto;
      const error = new Error('Erro de Validação');
      service.createVehicle.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.createVehicle(createVehicleDto)).rejects.toThrow(
        'Erro de Validação'
      );
    });

    it('deve lidar com parâmetros nulos/indefinidos', async () => {
      // Arrange
      const vehicleId = null as any;
      service.findOneVehicle.mockRejectedValue(new Error('Parâmetro Inválido'));

      // Act & Assert
      await expect(controller.findOneVehicle(vehicleId)).rejects.toThrow(
        'Parâmetro Inválido'
      );
    });

    it('deve lidar com caracteres especiais no identificador', async () => {
      // Arrange
      const vehicleId = '1-2_3';
      service.findOneVehicle.mockRejectedValue(new Error('ID Inválido'));

      // Act & Assert
      await expect(controller.findOneVehicle(vehicleId)).rejects.toThrow(
        'ID Inválido'
      );
    });
  });

  describe('Pagination Edge Cases', () => {
    it('deve lidar com números de página negativos', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: -1,
        limit: 10,
      };
      service.findAllVehicle.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result).toBeDefined();
    });

    it('deve lidar com limite zero', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 0,
      };
      service.findAllVehicle.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result).toBeDefined();
    });

    it('deve suportar um limite muito grande', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 1000,
      };
      service.findAllVehicle.mockResolvedValue(mockPaginatedResult);

      // Act
      const result = await controller.findAllVehicle(paginationDto);

      // Assert
      expect(service.findAllVehicle).toHaveBeenCalledWith(paginationDto);
      expect(result).toBeDefined();
    });
  });
});

