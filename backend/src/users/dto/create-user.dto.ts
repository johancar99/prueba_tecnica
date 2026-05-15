import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'nuevo@clinica.com', description: 'Email único del usuario' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @ApiProperty({ example: 'Passw0rd!', description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({ example: 'Dr. Ana López', description: 'Nombre completo' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiProperty({
    enum: Role,
    example: Role.DOCTOR,
    description: 'Rol asignado al usuario',
  })
  @IsEnum(Role, { message: 'El rol debe ser ADMIN, DOCTOR o PATIENT' })
  role: Role;

  // --- Campos de perfil Doctor ---

  @ApiPropertyOptional({
    example: 'LIC-00123',
    description: '[Solo rol DOCTOR] Número de licencia médica único',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({
    example: 'Cardiología',
    description: '[Solo rol DOCTOR] Especialidad médica',
  })
  @IsOptional()
  @IsString()
  specialty?: string;

  // --- Campos de perfil Patient ---

  @ApiPropertyOptional({
    example: '1990-06-15',
    description: '[Solo rol PATIENT] Fecha de nacimiento (ISO 8601)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato ISO 8601 (YYYY-MM-DD)' })
  @Type(() => String)
  birthDate?: string;

  @ApiPropertyOptional({ example: '+34 600 111 222', description: '[Solo rol PATIENT] Teléfono' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Calle Mayor 1, Madrid',
    description: '[Solo rol PATIENT] Dirección',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
