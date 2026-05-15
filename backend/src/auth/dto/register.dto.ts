import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'nuevo@clinica.com',
    description: 'Correo electrónico único del usuario',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @ApiProperty({
    example: 'Passw0rd!',
    description: 'Contraseña (mínimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @ApiProperty({
    example: 'Dr. Ana López',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  name: string;

  @ApiPropertyOptional({
    enum: [Role.DOCTOR, Role.PATIENT],
    example: Role.PATIENT,
    description: 'Rol del usuario. Por defecto: PATIENT',
  })
  @IsOptional()
  @IsEnum([Role.DOCTOR, Role.PATIENT], {
    message: 'El rol debe ser DOCTOR o PATIENT',
  })
  role?: Role.DOCTOR | Role.PATIENT;
}
