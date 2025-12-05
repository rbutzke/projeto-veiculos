import { Injectable, NotFoundException } from '@nestjs/common';
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

  constructor(@Inject(PG_POOL) private readonly pgPool: Pool) {
      //this.pgPool.connect();
  }

  async createVehicle(createVehicleDto: CreateVehicleDto): Promise<VehicleEntity> {

          //Extrai as chaves do objeto DTO (colunas)
      const columns = Object.keys(createVehicleDto);
      //Extrai os valores do objeto DTO (valores a serem inseridos)
      const values = Object.values(createVehicleDto);

      //Gera os placeholders parametrizados (e.g., "$1, $2, $3")
      //O driver pg usa $N para prevenir SQL Injection.
      const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
    
      //Monta a string SQL dinamicamente
      const queryText = `
        INSERT INTO vehicle (${columns.join(', ')})
        VALUES (${placeholders})
        RETURNING *;
      `;
  
      // Executa a query com os valores parametrizados
      const res = await this.pgPool.query(queryText, values);

      // Retorna o primeiro registro inserido, agora tipado 
      return res.rows[0] as VehicleEntity; // Usa um type assertion para garantir o tipo retornado
  }

  async findAllVehicle(paginationDto: PaginationDto): Promise<{ vehicles: ReturnVehicleDto[], total: number, page: number, totalPages: number }> {

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const offset = (page - 1) * limit;

    const countResult = await this.pgPool.query('SELECT COUNT(*) FROM vehicle');
    const total = parseInt(countResult.rows[0].count)


    //const result = await this.pgPool.query('SELECT * FROM users');
    const result = await this.pgPool.query('SELECT * FROM vehicle ORDER BY id LIMIT $1 OFFSET $2',[limit, offset]);
    
    if (!result){
      throw new NotFoundException('User Not found.');        
    }
    
    const totalPages = Math.ceil(total / limit);

    return {
    vehicles: result.rows.map((vehicleEntity) => new ReturnVehicleDto(vehicleEntity)),
    total,
    page,
    totalPages
  };
  }



  async findOneVehicle(id: number) {
    const query = 'SELECT * FROM vehicle WHERE id = $1';
    const values = [id];
    const result = await this.pgPool.query(query, values);

    if (result.rows.length === 0) {
        throw new NotFoundException(`Veiculo com o ID "${id}" não encontrado.`);
    }

    return result.rows[0];

  }

    // Atualiza um usuário existente com base no ID fornecido e nos dados do DTO
  async updateVehicle(id: number, updateVehicleDto: UpdateVehicleDto) : Promise<VehicleEntity> {

    const columns = Object.keys(updateVehicleDto);
    const values = Object.values(updateVehicleDto);
    console.log('update columns:', columns);
    console.log('update values:', values);

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
  }

  async updateFullVehicle(id: number, updateVehicleDto: UpdateVehicleDto) : Promise<VehicleEntity> {

    const columns = Object.keys(updateVehicleDto);
    const values = Object.values(updateVehicleDto);
    console.log('update columns:', columns);
    console.log('update values:', values);

    if (columns.length === 0) {
      throw new NotFoundException(`Veiculo com o ID "${id}" não encontrado para Atualização.`);
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
  }


  async removeVehicle(id: number) {
    
    const query = 'DELETE FROM vehicle WHERE id = $1 RETURNING *';
    const values = [id];
    const result = await this.pgPool.query(query, values);
    // Returns the deleted row data
    return result.rows[0]; 
  }
}
