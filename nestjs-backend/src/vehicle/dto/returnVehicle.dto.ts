import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleEntity } from '../entities/vehicle.entity';

export class ReturnVehicleDto {
    id: number; 
    placa: string;
    chassi: string;
    renavam: string;
    modelo: string;
    marca: string;
    ano: number;

  constructor(vehicle: VehicleEntity) {
    this.id = vehicle.id;
    this.placa = vehicle.placa;
    this.chassi = vehicle.chassi;
    this.renavam = vehicle.renavam;
    this.modelo = vehicle.modelo;
    this.marca = vehicle.marca;
    this.ano = vehicle.ano;
   
  }
}