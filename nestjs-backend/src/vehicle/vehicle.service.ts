import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../common/database/pg.constants';
import { CreateVehicleDto } from './dto/createVehicle.dto';
import { UpdateVehicleDto } from './dto/updateVehicle.dto';
import { VehicleEntity } from './entities/vehicle.entity';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { ReturnVehicleDto } from './dto/returnVehicle.dto';

@Injectable()
export class VehicleService {

  constructor(@Inject(PG_POOL) private readonly pgPool: Pool) {}

  async createVehicle(createVehicleDto: CreateVehicleDto): Promise<VehicleEntity> {
      try {
      // Verificar se o veículo já existe
      const existVehicle = await this.pgPool.query(
        'SELECT id FROM vehicle WHERE placa = $1',
        [createVehicleDto.placa]
      );

      if (existVehicle.rows.length > 0) {
        throw new ConflictException(`Veículo com a Placa ${createVehicleDto.placa} já existente`);
      }


      const columns = Object.keys(createVehicleDto);
      const values = Object.values(createVehicleDto);

      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
      const queryText = `
        INSERT INTO vehicle (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;
  
      const res = await this.pgPool.query(queryText, values);

      return res.rows[0] as VehicleEntity;
      
      } catch (error) {
        if (error instanceof ConflictException) {
           throw error;
      }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new InternalServerErrorException(`Erro ao criar Veículo: ${errorMessage}`);
      }
    
  }

  async findAllVehicle(paginationDto: PaginationDto): Promise<{ vehicles: ReturnVehicleDto[], total: number, page: number, totalPages: number }> {
    try { 
      const page = paginationDto.page || 1;
      const limit = paginationDto.limit || 10;
      const offset = (page - 1) * limit;

      const countResult = await this.pgPool.query('SELECT COUNT(*) FROM vehicle');
      const total = parseInt(countResult.rows[0].count);

      const result = await this.pgPool.query(
        'SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',
        [limit, offset]
      );       
      
      const totalPages = Math.ceil(total / limit);

      return {
        vehicles: result.rows.map((vehicleEntity) => new ReturnVehicleDto(vehicleEntity)),
        total,
        page,
        totalPages
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao buscar veículos: ${errorMessage}`);
    }
  }

  async findOneVehicle(id: number) {
    try { 
      const query = 'SELECT * FROM vehicle WHERE id = $1';
      const values = [id];
      const result = await this.pgPool.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundException(`Veiculo não encontrado.`);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao buscar veiculo com ID: "${id}": ${errorMessage}`); 
    }
  }

  async updateVehicle(id: number, updateVehicleDto: UpdateVehicleDto): Promise<VehicleEntity> {
    try {
      const columns = Object.keys(updateVehicleDto);
      const values = Object.values(updateVehicleDto);

      if (columns.length === 0) {
        throw new NotFoundException(`Sem informação fornecida para Atualização.`);
      }

      const setClause = columns
        .map((column, index) => `${column} = $${index + 1}`)
        .join(', ');

      values.push(id);
      const idPlaceholder = `$${values.length}`;

      const queryText = `
        UPDATE vehicle
        SET ${setClause}
        WHERE id = ${idPlaceholder}
        RETURNING *;
      `;

      const res = await this.pgPool.query(queryText, values);
      
      if (res.rows.length === 0) {
        throw new NotFoundException(`Veiculo com o ID "${id}" não encontrado!!!.`);
      }

      return res.rows[0] as VehicleEntity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao atualizar veiculo com ID: "${id}": ${errorMessage}`);
    }
  }

  async removeVehicle(id: number) {
    try {
      const query = 'DELETE FROM vehicle WHERE id = $1 RETURNING *';
      const values = [id];
      const result = await this.pgPool.query(query, values);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`Veiculo com o ID "${id}" não encontrado.`);
      }
      
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new InternalServerErrorException(`Erro ao remover veiculo com ID: "${id}": ${errorMessage}`);
    }
  }
}