import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './createVehicle.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
