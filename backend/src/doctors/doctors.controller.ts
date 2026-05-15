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

@ApiTags('Doctors')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: '[ADMIN] Listar médicos',
    description: 'Retorna todos los perfiles de médicos con datos de usuario, paginados.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de médicos',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: [
          {
            id: 'clxyz...',
            licenseNumber: 'LIC-00123',
            specialty: 'Cardiología',
            createdAt: '2026-05-15T00:00:00.000Z',
            user: {
              id: 'clxyz...',
              email: 'doctor@clinica.com',
              name: 'Dr. Ana López',
              role: 'DOCTOR',
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
    return this.usersService.findDoctors(pagination);
  }
}
