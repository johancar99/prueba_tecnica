import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------------------------------------------------------------------------
  // GET /users
  // ---------------------------------------------------------------------------
  @Get()
  @ApiOperation({
    summary: '[ADMIN] Listar usuarios',
    description:
      'Retorna todos los usuarios con paginación. Permite filtrar por `role` y buscar por `name` o `email`.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de usuarios',
    schema: {
      example: {
        data: [
          {
            id: 'clxyz...',
            email: 'admin@clinica.com',
            name: 'Administrador',
            role: 'ADMIN',
            createdAt: '2026-05-15T00:00:00.000Z',
            doctor: null,
            patient: null,
          },
        ],
        meta: {
          total: 3,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
  })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  // ---------------------------------------------------------------------------
  // GET /users/doctors
  // ---------------------------------------------------------------------------
  @Get('doctors')
  @ApiOperation({
    summary: '[ADMIN] Listar médicos',
    description: 'Retorna todos los perfiles de médicos con datos de usuario, paginados.',
  })
  @ApiOkResponse({ description: 'Lista paginada de médicos' })
  findDoctors(@Query() pagination: PaginationDto) {
    return this.usersService.findDoctors(pagination);
  }

  // ---------------------------------------------------------------------------
  // GET /users/patients
  // ---------------------------------------------------------------------------
  @Get('patients')
  @ApiOperation({
    summary: '[ADMIN] Listar pacientes',
    description: 'Retorna todos los perfiles de pacientes con datos de usuario, paginados.',
  })
  @ApiOkResponse({ description: 'Lista paginada de pacientes' })
  findPatients(@Query() pagination: PaginationDto) {
    return this.usersService.findPatients(pagination);
  }

  // ---------------------------------------------------------------------------
  // GET /users/:id
  // ---------------------------------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: '[ADMIN] Obtener usuario por ID' })
  @ApiOkResponse({ description: 'Datos completos del usuario (sin password)' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // POST /users
  // ---------------------------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '[ADMIN] Crear usuario',
    description:
      'Crea un usuario con el rol indicado y genera automáticamente su perfil (doctor/patient).\n\n' +
      'Si el rol es `DOCTOR`, el campo `licenseNumber` es **obligatorio**.',
  })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente (sin password)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/:id
  // ---------------------------------------------------------------------------
  @Patch(':id')
  @ApiOperation({
    summary: '[ADMIN] Actualizar usuario',
    description: 'Actualiza nombre y/o campos del perfil del usuario.',
  })
  @ApiOkResponse({ description: 'Usuario actualizado (sin password)' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /users/:id
  // ---------------------------------------------------------------------------
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[ADMIN] Eliminar usuario' })
  @ApiNoContentResponse({ description: 'Usuario eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
