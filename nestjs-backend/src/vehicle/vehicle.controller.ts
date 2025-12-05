import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Query } from '@nestjs/common';
import { CreateVehicleDto } from './dto/createVehicle.dto';
import { UpdateVehicleDto } from './dto/updateVehicle.dto';
import { VehicleService } from './vehicle.service';
import { JwtAuthGuard } from '../auth/guards/jwtAuth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PaginationDto } from '../common/pagination/pagination.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehiclesService: VehicleService) {}

  @Post()
  @Roles('admin', 'manager')
  createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(createVehicleDto);
  }

  @Get()
  @Roles('admin', 'manager', 'user')
  findAllVehicle(@Query() paginationDto: PaginationDto) {
    return this.vehiclesService.findAllVehicle(paginationDto);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'user')
  findOneVehicle(@Param('id') id: string) {
    return this.vehiclesService.findOneVehicle(+id);
  }
  
  
  @Patch(':id')
  @Roles('admin', 'manager')
  updateVehicle(@Param('id') id: string, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehiclesService.updateVehicle(+id, updateVehicleDto);
  }

  @Delete(':id')
  @Roles('admin')
  removeVehicle(@Param('id') id: string) {
    return this.vehiclesService.removeVehicle(+id);
  }
}

