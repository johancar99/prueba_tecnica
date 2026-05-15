import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('patients')
export class PatientsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: '[ADMIN] Listar pacientes',
    description: 'Retorna todos los perfiles de pacientes con datos de usuario, paginados.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de pacientes',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: [
          {
            id: 'clxyz...',
            birthDate: '1990-06-15T00:00:00.000Z',
            phone: '+34 600 111 222',
            address: 'Calle Mayor 1, Madrid',
            createdAt: '2026-05-15T00:00:00.000Z',
            user: {
              id: 'clxyz...',
              email: 'paciente@clinica.com',
              name: 'Juan Pérez',
              role: 'PATIENT',
              createdAt: '2026-05-15T00:00:00.000Z',
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
  })
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findPatients(pagination);
  }
}
