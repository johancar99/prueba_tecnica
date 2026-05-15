import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminService } from './admin.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';

@ApiTags('Admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  @ApiOperation({
    summary: '[ADMIN] Panel de métricas',
    description:
      'Retorna indicadores globales del sistema:\n\n' +
      '- **totals**: conteo total de médicos, pacientes y prescripciones.\n' +
      '- **byStatus**: distribución de prescripciones por estado (`pending`, `completed`, `cancelled`).\n' +
      '- **byDay**: serie temporal de los últimos 30 días con el número de prescripciones creadas por día.\n' +
      '- **topDoctors**: ranking de los 10 médicos con más prescripciones emitidas.',
  })
  @ApiOkResponse({
    description: 'Métricas del panel administrativo',
    schema: {
      example: {
        statusCode: 200,
        message: 'OK',
        data: {
          totals: { doctors: 3, patients: 12, prescriptions: 47 },
          byStatus: { pending: 30, completed: 12, cancelled: 5 },
          byDay: [
            { date: '2026-04-15', count: 2 },
            { date: '2026-04-16', count: 0 },
            { date: '2026-05-14', count: 5 },
          ],
          topDoctors: [
            {
              doctorId: 'clxyz...',
              licenseNumber: 'LIC-001',
              specialty: 'Cardiología',
              name: 'Dr. Juan Pérez',
              email: 'doctor@clinica.com',
              prescriptionsCount: 18,
            },
          ],
        },
      },
    },
  })
  @ApiForbiddenResponse({ description: 'Acceso denegado — se requiere rol ADMIN' })
  getMetrics(@Query() query: QueryMetricsDto) {
    return this.adminService.getMetrics(query);
  }
}
