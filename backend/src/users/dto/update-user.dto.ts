import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'María García', description: 'Nombre completo' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Neurología', description: '[Doctor] Especialidad médica' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ example: '1985-03-20', description: '[Patient] Fecha de nacimiento' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: '+34 600 333 444', description: '[Patient] Teléfono' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. Libertad 22, Barcelona', description: '[Patient] Dirección' })
  @IsOptional()
  @IsString()
  address?: string;
}
