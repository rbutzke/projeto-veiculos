import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthDto } from './createAuth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
