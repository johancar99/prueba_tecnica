import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Valida credenciales y retorna un par de tokens JWT.\n\n' +
      '**Cuentas de prueba rápida:**\n' +
      '- `admin@clinica.com` / `Admin123!`\n' +
      '- `doctor@clinica.com` / `Doctor123!`\n' +
      '- `paciente@clinica.com` / `Patient123!`',
  })
  @ApiOkResponse({
    description: 'Login exitoso',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea un usuario con rol `PATIENT` (por defecto) o `DOCTOR`.',
  })
  @ApiCreatedResponse({
    description: 'Usuario creado exitosamente',
    schema: {
      example: {
        user: {
          id: 'clxyz...',
          email: 'nuevo@clinica.com',
          name: 'Dr. Ana López',
          role: 'DOCTOR',
          createdAt: '2026-05-15T00:00:00.000Z',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiConflictResponse({ description: 'El email ya está registrado' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshAuthGuard)
  @ApiOperation({
    summary: 'Renovar tokens',
    description: 'Recibe el `refreshToken` y retorna un nuevo par de tokens (rotación).',
  })
  @ApiOkResponse({
    description: 'Tokens renovados',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
  refresh(
    @CurrentUser() user: { sub: string; refreshToken: string },
    @Body() _dto: RefreshDto,
  ) {
    return this.authService.refresh(user.sub, user.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión', description: 'Invalida el refresh token del usuario.' })
  @ApiOkResponse({ description: 'Sesión cerrada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Obtener perfil',
    description: 'Retorna los datos del usuario autenticado, su rol y perfil (doctor/paciente).',
  })
  @ApiOkResponse({
    description: 'Perfil del usuario',
    schema: {
      example: {
        id: 'clxyz...',
        email: 'admin@clinica.com',
        name: 'Administrador',
        role: 'ADMIN',
        createdAt: '2026-05-15T00:00:00.000Z',
        doctor: null,
        patient: null,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado' })
  profile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }
}
