import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Length } from "class-validator";

export class CreateVehicleDto {
    @ApiProperty({
      description: 'Placa que será cadastrada',
      example: 'XRT5048'
    })
    @Length(7)
    @IsString()
    @IsNotEmpty()
    placa: string;

    @ApiProperty({
      description: 'Chassi do veículo',
      example: '9BWZZZ377VT004251'
    })
    @Length(17)
    @IsString()
    @IsNotEmpty()
    chassi: string;

    @ApiProperty({
      description: 'Número do Renavam do veículo',
      example: '12345678900'
    })
    @Length(11)
    @IsString()
    @IsNotEmpty()
    renavam: string;

    @ApiProperty({
      description: 'Modelo do veículo',
      example: 'Gol'
    })
    @IsString()
    @IsNotEmpty()
    modelo: string;

    @ApiProperty({
      description: 'Marca do veículo',
      example: 'Volkswagen'
    })
    @IsString()
    @IsNotEmpty()
    marca: string;

    @ApiProperty({
      description: 'Ano de fabricação do veículo',
      example: 2025
    })
    @IsNotEmpty()
    @IsNumber()
    ano: number;
}
