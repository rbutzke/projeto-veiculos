import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import { Pool } from 'pg';
import { VehicleService } from '../vehicle.service';
import { CreateVehicleDto } from '../dto/createVehicle.dto';
import { UpdateVehicleDto } from '../dto/updateVehicle.dto';
import { PaginationDto } from '../../common/pagination/pagination.dto';
import { ReturnVehicleDto } from '../dto/returnVehicle.dto';
import { VehicleEntity } from '../entities/vehicle.entity';
import { PG_POOL } from '../../common/database/pg.constants';

const mockVehicleEntity: VehicleEntity = {
  id: 1,
  placa: 'ABC1234',
  chassi: 'XYZ987654321',
  renavam: '12345678901',      
  marca: 'Toyota',
  modelo: 'Corolla',
  ano: 2022,
  data_cadastro: new Date('2024-01-01'),
  data_alteracao: new Date('2024-01-01'),
};



const mockPool = {
  query: jest.fn(),
};

describe('VehicleService', () => {
  let service: VehicleService;
  let pool: jest.Mocked<Pool>;

  beforeEach(async () => {
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

      // Primeiro: verificação - veículo não existe
      pool.query
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        })
        // Segundo: inserção
        .mockResolvedValueOnce({
          rows: [mockVehicleEntity],
          rowCount: 1,
        });


      const result = await service.createVehicle(createVehicleDto);

      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        'SELECT id FROM vehicle WHERE placa = $1',
        ['ABC1234']
      );
      
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve apresentar um erro quando a consulta ao banco de dados falhar', async () => {

  const createVehicleDto: CreateVehicleDto = {
    placa: 'ABC1234',
    chassi: 'XYZ987654321',
    renavam: '12345678901',      
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2022,
  };

  // Mock que simula um erro no banco de dados
  // O erro pode acontecer em QUALQUER query
  const mockError = new Error('Erro no Database');
  
  // Quando a primeira query (SELECT) for chamada, lança erro
  pool.query.mockRejectedValue(mockError);


  await expect(service.createVehicle(createVehicleDto)).rejects.toThrow(
    InternalServerErrorException
  );
  await expect(service.createVehicle(createVehicleDto)).rejects.toThrow(
    'Erro no Database'
  );
  
  // Verifica a mensagem completa
  try {
    await service.createVehicle(createVehicleDto);
  } catch (error) {
    expect(error).toBeInstanceOf(InternalServerErrorException);
    expect(error.message).toContain('Erro ao criar Veículo: Erro no Database');
  }
   });

    it('deve lançar ConflictException quando veículo já existir', async () => {
  const createVehicleDto: CreateVehicleDto = {
    placa: 'ABC1234',
    chassi: 'XYZ987654321',
    renavam: '12345678901',      
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2022,
  };

  pool.query.mockResolvedValue({
    rows: [{ id: 1 }], 
    rowCount: 1,
    command: 'SELECT',
    oid: 0,
    fields: [],
  });

  await expect(service.createVehicle(createVehicleDto)).rejects.toThrow(
    ConflictException
  );
 });
});



  describe('findAllVehicle', () => {
    it('deve retornar veículos paginados', async () => {
      const paginationDto: PaginationDto = {
        page: 1,
        limit: 10,
      };

      const mockVehiclesResult = {
        rows: [mockVehicleEntity, { ...mockVehicleEntity, id: 2 }],
        rowCount: 2,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce(mockVehiclesResult);

      const result = await service.findAllVehicle(paginationDto);

      expect(pool.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM vehicle');
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles[0]).toBeInstanceOf(ReturnVehicleDto);
    });

    it('deve usar os valores de paginação padrão quando não forem fornecidos', async () => {
      const paginationDto: PaginationDto = {};
      const mockVehiclesResult = {
        rows: [mockVehicleEntity],
        rowCount: 1,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce(mockVehiclesResult);

      const result = await service.findAllVehicle(paginationDto);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [10, 0]
      );
      expect(result.page).toBe(1);
    });

    it('deve retornar um array vazio quando nenhum veículo for encontrado', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.findAllVehicle(paginationDto);

      expect(result.vehicles).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('findOneVehicle', () => {
    it('deve devolver o veículo quando encontrado', async () => {
      const vehicleId = 1;
      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      const result = await service.findOneVehicle(vehicleId);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle WHERE id = $1',
        [vehicleId]
      );
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve lançar uma exceção NotFoundException quando o veículo não for encontrado', async () => {
      const vehicleId = 999;
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        `Veiculo não encontrado.`
      );
    });

    it('deve lançar InternalServerErrorException quando houver erro no banco', async () => {
      const vehicleId = 1;
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        `Erro ao buscar veiculo com ID: "${vehicleId}": Database connection error`
      );
    });
  });

  describe('updateVehicle', () => {
    it('deve atualizar o veículo com sucesso', async () => {
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

      const result = await service.updateVehicle(vehicleId, updateVehicleDto);

      expect(pool.query).toHaveBeenCalled();
      expect(result).toEqual(updatedVehicle);
    });

    it('Deve lançar uma exceção NotFoundException quando nenhum dado de atualização for fornecido', async () => {
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = {};

      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        'Sem informação fornecida para Atualização.'
      );
    });

    it('Deve apresentar uma exceção NotFoundException quando o veículo não for encontrado para atualização', async () => {
      const vehicleId = 999;
      const updateVehicleDto: UpdateVehicleDto = {
        marca: 'Renault',
      };

      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        `Veiculo com o ID "${vehicleId}" não encontrado!!!.`
      );
    });

    it('deve lançar InternalServerErrorException quando houver erro no banco', async () => {
      const vehicleId = 1;
      const updateVehicleDto: UpdateVehicleDto = { marca: 'Renault' };
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.updateVehicle(vehicleId, updateVehicleDto)).rejects.toThrow(
        `Erro ao atualizar veiculo com ID: "${vehicleId}": Database connection error`
      );
    });
  });
 
  describe('removeVehicle', () => {
    it('deve remover o veículo com sucesso', async () => {
      const vehicleId = 1;
      
      pool.query.mockResolvedValue({
        rows: [mockVehicleEntity],
        rowCount: 1,
      });

      const result = await service.removeVehicle(vehicleId);

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM vehicle WHERE id = $1 RETURNING *',
        [vehicleId]
      );
      expect(result).toEqual(mockVehicleEntity);
    });

    it('deve lançar NotFoundException quando veículo não for encontrado para exclusão', async () => {
      const vehicleId = 999;
      
      pool.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      await expect(service.removeVehicle(vehicleId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.removeVehicle(vehicleId)).rejects.toThrow(
        `Veiculo com o ID "${vehicleId}" não encontrado.`
      );
    });

    it('deve lançar InternalServerErrorException quando houver erro no banco', async () => {
      const vehicleId = 1;
      const mockError = new Error('Database connection error');
      pool.query.mockRejectedValue(mockError);

      await expect(service.removeVehicle(vehicleId)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.removeVehicle(vehicleId)).rejects.toThrow(
        `Erro ao remover veiculo com ID: "${vehicleId}": Database connection error`
      );
    });
  });

  describe('Edge Cases', () => {
    it('deve lidar com tentativas de injeção de SQL', async () => {
      const maliciousDto: CreateVehicleDto = {
        placa: "'; DROP TABLE vehicle; --",
        chassi: 'Test123',
        renavam: 'Test456',
        marca:  'Testzzz',
        modelo: 'Testdel',
        ano: 2022,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [mockVehicleEntity], rowCount: 1 });

      await service.createVehicle(maliciousDto);

      expect(pool.query).toHaveBeenNthCalledWith(
        1,
        'SELECT id FROM vehicle WHERE placa = $1',
        ["'; DROP TABLE vehicle; --"]
      );
    });

    it('deve lidar com números de página muito grandes', async () => {
      const paginationDto: PaginationDto = {
        page: 1000,
        limit: 10,
      };

      pool.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const result = await service.findAllVehicle(paginationDto);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [10, 9990]
      );
      expect(result.vehicles).toHaveLength(0);
    });

    it('deve lidar com erros de conexão de banco de dados', async () => {
      const vehicleId = 1;
      const connectionError = new Error('Conexão Recusada');
      pool.query.mockRejectedValue(connectionError);

      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        InternalServerErrorException
      );
      await expect(service.findOneVehicle(vehicleId)).rejects.toThrow(
        'Conexão Recusada'
      );
    });
  });
});