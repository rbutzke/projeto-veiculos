import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './createUser.dto';

export class UpdateAuthDto extends PartialType(CreateUserDto) {}
