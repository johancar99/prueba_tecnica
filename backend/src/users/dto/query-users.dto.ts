import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '../../common/enums/role.enum';

export class QueryUsersDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: Role,
    example: Role.DOCTOR,
    description: 'Filtrar por rol',
  })
  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser ADMIN, DOCTOR o PATIENT' })
  role?: Role;

  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Búsqueda por nombre o email (coincidencia parcial, insensible a mayúsculas)',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
