import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryPatientsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Buscar por nombre o email del paciente',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
