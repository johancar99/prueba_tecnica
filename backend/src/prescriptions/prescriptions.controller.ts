import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Role } from "../common/enums/role.enum";
import { PrescriptionsService } from "./prescriptions.service";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { QueryPrescriptionsDto } from "./dto/query-prescriptions.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";

interface ReqUser {
  id: string;
  role: Role;
}

@ApiTags("Prescriptions")
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("prescriptions")
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  // ---------------------------------------------------------------------------
  // POST /prescriptions  — Solo DOCTOR
  // ---------------------------------------------------------------------------
  @Post()
  @Roles(Role.DOCTOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "[DOCTOR] Crear prescripcion",
    description:
      "Crea una prescripcion con uno o mas medicamentos. Genera automaticamente un codigo unico (RX-YYYYMMDD-XXXXXXXX).",
  })
  @ApiCreatedResponse({
    description: "Prescripcion creada exitosamente",
    schema: {
      example: {
        id: "clxyz...",
        code: "RX-20260515-A1B2C3D4",
        status: "pending",
        notes: "Paciente hipertenso.",
        items: [{ medication: "Ibuprofeno 400mg", dosage: "400mg", frequency: "Cada 8h", duration: "7 dias" }],
      },
    },
  })
  create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: ReqUser,
  ) {
    return this.prescriptionsService.create(dto, user);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/me  — Solo PATIENT (DEBE ir antes de /:id)
  // ---------------------------------------------------------------------------
  @Get("me")
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary: "[PATIENT] Mis prescripciones",
    description: "Retorna las prescripciones del paciente autenticado, paginadas y con filtros.",
  })
  @ApiOkResponse({ description: "Lista paginada de prescripciones del paciente" })
  findMyPrescriptions(
    @Query() query: QueryPrescriptionsDto,
    @CurrentUser() user: ReqUser,
  ) {
    return this.prescriptionsService.findMyPrescriptions(query, user);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions  — DOCTOR (propias) | ADMIN (todas)
  // ---------------------------------------------------------------------------
  @Get()
  @Roles(Role.DOCTOR, Role.ADMIN)
  @ApiOperation({
    summary: "[DOCTOR/ADMIN] Listar prescripciones",
    description:
      "El ADMIN ve todas las prescripciones. El DOCTOR solo ve las que el creo. Soporta filtros de estado y rango de fechas.",
  })
  @ApiOkResponse({ description: "Lista paginada de prescripciones" })
  findAll(
    @Query() query: QueryPrescriptionsDto,
    @CurrentUser() user: ReqUser,
  ) {
    return this.prescriptionsService.findAll(query, user);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/:id  — Todos los roles (con validacion de propiedad)
  // ---------------------------------------------------------------------------
  @Get(":id")
  @Roles(Role.DOCTOR, Role.PATIENT, Role.ADMIN)
  @ApiOperation({
    summary: "[DOCTOR/PATIENT/ADMIN] Obtener prescripcion por ID",
    description:
      "El DOCTOR solo puede ver sus propias prescripciones. El PATIENT solo las suyas. El ADMIN puede ver todas.",
  })
  @ApiOkResponse({ description: "Datos completos de la prescripcion" })
  findOne(@Param("id") id: string, @CurrentUser() user: ReqUser) {
    return this.prescriptionsService.findOne(id, user);
  }

  // ---------------------------------------------------------------------------
  // PUT /prescriptions/:id/consume  — Solo PATIENT
  // ---------------------------------------------------------------------------
  @Put(":id/consume")
  @Roles(Role.PATIENT)
  @ApiOperation({
    summary: "[PATIENT] Actualizar estado de prescripcion",
    description:
      "El paciente puede marcar su prescripcion como consumed. Solo aplica a prescripciones en estado pending.",
  })
  @ApiOkResponse({ description: "Estado actualizado y consumedAt registrado" })
  consume(
    @Param("id") id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: ReqUser,
  ) {
    return this.prescriptionsService.consume(id, dto.status, user);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/:id/pdf  — DOCTOR (propia) | PATIENT (propia) | ADMIN
  // ---------------------------------------------------------------------------
  @Get(":id/pdf")
  @Roles(Role.DOCTOR, Role.PATIENT, Role.ADMIN)
  @ApiOperation({
    summary: "[DOCTOR/PATIENT/ADMIN] Descargar PDF de prescripcion",
    description:
      "Genera y descarga el PDF de la prescripcion con datos del medico, paciente, medicamentos y codigo QR.",
  })
  @ApiOkResponse({ description: "PDF de la prescripcion (application/pdf)" })
  async getPdf(
    @Param("id") id: string,
    @CurrentUser() user: ReqUser,
    @Res() res: Response,
  ) {
    const buffer = await this.prescriptionsService.generatePdf(id, user);
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="prescripcion-${id}.pdf"`,
      "Content-Length": buffer.length,
    });
    res.end(buffer);
  }
}
