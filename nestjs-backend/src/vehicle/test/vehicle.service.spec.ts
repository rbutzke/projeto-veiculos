import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { VehicleService } from '../vehicle.service';
import { CreateVehicleDto } from '../dto/createVehicle.dto';
import { UpdateVehicleDto } from '../dto/updateVehicle.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { ReturnVehicleDto } from '../dto/returnVehicle.dto';
import { PG_POOL } from '../../common/database/pg.constants';

// Mock de dados para testes
const mockVehicleEntity = {
  id: 1,
  placa: 'ABC1234',
  chassi: 'XYZ987654321',
  renavam: '12345678901',      
  marca: 'Toyota',
  modelo: 'Corolla',
  data_cadastro: new Date(),
  data_alteracao: new Date(),
};

// Mock do Pool 
const mockPool = {
  query: jest.fn(),
};

describe('VehicleService', () => {
  let service: VehicleService;
  let pool: jest.Mocked<Pool>;

  beforeEach(async () => {
    // Reset do mock antes de cada teste
    mockPool.query.mockReset();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleService,
        {
          provide: PG_POOL,
          useValue: mockPool,
        },
      ],
    }).compile();

    service = module.get<VehicleService>(VehicleService);
    pool = mockPool as jest.Mocked<Pool>;
    
    // Suprimir console.log durante os testes
    jest.spyOn(console, 'log').mockImplementation(() => {});
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

      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      // Act
      const result = await service.createVehicle(createVehicleDto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO vehicle'),
        expect.arrayContaining(['ABC1234','XYZ987654321','12345678901', 'Toyota', 'Corolla', 2022])
      );
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve apresentar um erro quando a consulta ao banco de dados falhar', async () => {
      // Arrange
      const createVehicleDto: CreateVehicleDto = {
        placa: 'ABC1234',
        chassi: 'XYZ987654321',
        renavam: '12345678901',      
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2022,
      };

      const mockError = new Error('Erro no Database');
      pool.query.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(service.createVehicle(createVehicleDto)).rejects.toThrow(
        'Erro no Database'
      );
    });
  });

  describe('findAllVehicle', () => {
    it('deve retornar veículos paginados', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      const mockVehiclesResult = {
        rows: [mockVehicleEntity, { ...mockVehicleEntity, id: 2 }],
        rowCount: 2,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 }) // Para count
        .mockResolvedValueOnce(mockVehiclesResult); // Para select

      // Act
      const result = await service.findAllVehicle(paginationDto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM vehicle');
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [10, 0]
      );
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles[0]).toBeInstanceOf(ReturnVehicleDto);
    });

    it('deve usar os valores de paginação padrão quando não forem fornecidos', async () => {
      // Arrange
      const paginationDto: PaginationDto = {};
      const mockVehiclesResult = {
        rows: [mockVehicleEntity],
        rowCount: 1,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce(mockVehiclesResult);

      // Act
      const result = await service.findAllVehicle(paginationDto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [10, 0]
      );
      expect(result.page).toBe(1);
      expect(result).toEqual({
        vehicles: expect.any(Array),
        total: 10,
        page: 1,
        totalPages: 1,
      });
    });

    it('deve retornar um array vazio quando nenhum veículo for encontrado', async () => {
      // Arrange
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const result = await service.findAllVehicle(paginationDto);

      // Assert
      expect(result.vehicles).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findOneVehicle', () => {
    it('deve devolver o veículo quando encontrado', async () => {
      // Arrange
      const vehicleId = 1;
      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      // Act
      const result = await service.findOneVehicle(vehicleId);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle WHERE id = $1',
        [vehicleId]
      );
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve lançar uma exceção NotFoundException quando o veículo não for encontrado', async () => {
      // Arrange
      const vehicleId = 999;
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      // Act & Assert
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        `Veiculo com o ID "${vehicleId}" não encontrado.`
      );
    });
  });

  describe('updateVehicle', () => {
    it('deve atualizar o veículo com sucesso', async () => {
      // Arrange
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Renault',
        modelo: 'Sandero',
      };

      const updatedVehicle = {
        ...mockVehicleEntity,
        ...updateVehicleDto,
      };

      pool.query.mockResolvedValue({
        rows: [updatedVehicle],
        rowCount: 1,
      });

      // Act
      const result = await service.updateVehicle(vehicleId, updateVehicleDto);

      // Assert
      expect(pool.query).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });

    it('Deve lançar uma exceção NotFoundException quando nenhum dado de atualização for fornecido', async () => {
      // Arrange
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = {};

      // Act & Assert
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        'Sem informação fornecida para Atualização.'
      );
    });

    it('Deve apresentar uma exceção NotFoundException quando o veículo não for encontrado para atualização', async () => {
      // Arrange
      const vehicleId = 999;
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Renault',
      };

      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      // Act & Assert
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        `Veiculo com o ID "${vehicleId}" não encontrado!!!.`
      );
    });
  });

  describe('updateFullVehicle', () => {
    it('deve atualizar todos os campos do veículo com sucesso', async () => {
      // Arrange
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = {
        placa: 'ZZC1234',
        chassi: 'ZZZ987654321',
        renavam: 'ZZ345678901',      
        marca: 'Toyota',
        modelo: 'Corolla',
        ano: 2022,
      };

      const updatedVehicle = {
        ...mockVehicleEntity,
        ...updateVehicleDto,
      };

      pool.query.mockResolvedValue({
        rows: [updatedVehicle],
        rowCount: 1,
      });

      // Act
      const result = await service.updateFullVehicle(vehicleId, updateVehicleDto);

      // Assert
      expect(pool.query).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });

    it('deve apresentar uma exceção NotFoundException quando nenhum dado de atualização for fornecido', async () => {
      // Arrange
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = {};

      // Act & Assert
      await expect(service.updateFullVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateFullVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        `Veiculo com o ID "${vehicleId}" não encontrado para Atualização.`
      );
    });
  });

  describe('removeVehicle', () => {
    it('deve remover o veículo com sucesso', async () => {
      // Arrange
      const vehicleId = 1;
      
      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      // Act
      const result = await service.removeVehicle(vehicleId);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM vehicle WHERE id = $1 RETURNING *',
        [vehicleId]
      );
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve retornar undefined quando nenhum veículo for excluído', async () => {
      // Arrange
      const vehicleId = 999;
      
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      // Act
      const result = await service.removeVehicle(vehicleId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com tentativas de injeção de SQL', async () => {
      // Arrange
      const maliciousDto: CreateVehicleDto = {
        placa: "'; DROP TABLE vehicle; --",
        chassi: 'Test123',
        renavam: 'Test456',
        marca:  'Testzzz',
        modelo: 'Testdel',
        ano: 2022,
      };

      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      // Act
      await service.createVehicle(maliciousDto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([maliciousDto.placa])
      );
      const queryCall = pool.query.mock.calls[0][0] as string;
      expect(queryCall).not.toContain('DROP TABLE');
    });

    it('deve lidar com números de página muito grandes', async () => {
      // Arrange
      const paginationDto: PaginationDto = {
        page: 1000,
        limit: 10,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Act
      const result = await service.findAllVehicle(paginationDto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [10, 9990]
      );
      expect(result.vehicles).toHaveLength(0);
    });

    it('deve lidar com erros de conexão de banco de dados', async () => {
      // Arrange
      const vehicleId = 1;
      const connectionError = new Error('Conexão Recusada');
      pool.query.mockRejectedValueOnce(connectionError);

      // Act & Assert
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        'Conexão Recusada'
      );
    });
  });
});