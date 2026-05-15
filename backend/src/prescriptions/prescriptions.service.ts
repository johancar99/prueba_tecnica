import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { PdfService, PrescriptionPdfData } from "../pdf/pdf.service";
import { Role } from "../common/enums/role.enum";
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from "../common/interfaces/paginated-response.interface";
import { CreatePrescriptionDto } from "./dto/create-prescription.dto";
import { QueryPrescriptionsDto } from "./dto/query-prescriptions.dto";
import { AllowedStatusUpdate } from "./dto/update-status.dto";

/** Campos devueltos en todos los listados — consistente y sin datos sensibles */
const PRESCRIPTION_SELECT = {
  id: true,
  code: true,
  status: true,
  notes: true,
  consumedAt: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      licenseNumber: true,
      specialty: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  patient: {
    select: {
      id: true,
      birthDate: true,
      phone: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  items: {
    select: {
      id: true,
      medication: true,
      dosage: true,
      frequency: true,
      duration: true,
      instructions: true,
    },
  },
} satisfies Prisma.PrescriptionSelect;

interface RequestUser {
  id: string;
  role: Role;
}

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
  ) {}

  // ---------------------------------------------------------------------------
  // POST /prescriptions  — Solo DOCTOR
  // ---------------------------------------------------------------------------
  async create(dto: CreatePrescriptionDto, doctor: RequestUser) {
    const doctorProfile = await this.prisma.doctor.findUnique({
      where: { userId: doctor.id },
    });
    if (!doctorProfile) {
      throw new ForbiddenException("El usuario no tiene perfil de medico");
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Paciente con id "${dto.patientId}" no encontrado`);
    }

    const code = this.generateCode();

    const prescription = await this.prisma.$transaction(async (tx) => {
      return tx.prescription.create({
        data: {
          code,
          notes: dto.notes ?? null,
          authorId: doctorProfile.id,
          patientId: dto.patientId,
          items: {
            createMany: {
              data: dto.items.map((item) => ({
                medication: item.medication,
                dosage: item.dosage,
                frequency: item.frequency,
                duration: item.duration,
                instructions: item.instructions ?? null,
              })),
            },
          },
        },
        select: PRESCRIPTION_SELECT,
      });
    });

    return prescription;
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions  — DOCTOR (propias) | ADMIN (todas)
  // ---------------------------------------------------------------------------
  async findAll(
    query: QueryPrescriptionsDto,
    user: RequestUser,
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, status, from, to } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PrescriptionWhereInput = {
      ...(status && { status }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
        },
      }),
      // DOCTOR solo ve las suyas
      ...(user.role === Role.DOCTOR && {
        author: { userId: user.id },
      }),
    };

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        select: PRESCRIPTION_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return buildPaginatedResponse(prescriptions, total, page, limit);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/me  — Solo PATIENT (las suyas)
  // ---------------------------------------------------------------------------
  async findMyPrescriptions(
    query: QueryPrescriptionsDto,
    user: RequestUser,
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, status, from, to } = query;
    const skip = (page - 1) * limit;

    const patientProfile = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });
    if (!patientProfile) {
      throw new ForbiddenException("El usuario no tiene perfil de paciente");
    }

    const where: Prisma.PrescriptionWhereInput = {
      patientId: patientProfile.id,
      ...(status && { status }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to + "T23:59:59.999Z") }),
        },
      }),
    };

    const [prescriptions, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        select: PRESCRIPTION_SELECT,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return buildPaginatedResponse(prescriptions, total, page, limit);
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/:id  — DOCTOR (propia) | PATIENT (propia) | ADMIN
  // ---------------------------------------------------------------------------
  async findOne(id: string, user: RequestUser) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: PRESCRIPTION_SELECT,
    });

    if (!prescription) {
      throw new NotFoundException(`Prescripcion con id "${id}" no encontrada`);
    }

    await this.assertOwnership(prescription, user);
    return prescription;
  }

  // ---------------------------------------------------------------------------
  // PUT /prescriptions/:id/consume  — Solo PATIENT (la suya)
  // ---------------------------------------------------------------------------
  async consume(id: string, statusUpdate: AllowedStatusUpdate, user: RequestUser) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      select: PRESCRIPTION_SELECT,
    });

    if (!prescription) {
      throw new NotFoundException(`Prescripcion con id "${id}" no encontrada`);
    }

    // Paciente solo puede actualizar sus propias prescripciones
    const patientProfile = await this.prisma.patient.findUnique({
      where: { userId: user.id },
    });
    if (!patientProfile || prescription.patient.id !== patientProfile.id) {
      throw new ForbiddenException("No tienes permiso para modificar esta prescripcion");
    }

    if (prescription.status !== "pending") {
      throw new ForbiddenException(
        `Solo se pueden actualizar prescripciones en estado "pending". Estado actual: ${prescription.status}`,
      );
    }

    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: statusUpdate,
        consumedAt: statusUpdate === AllowedStatusUpdate.consumed ? new Date() : undefined,
      },
      select: PRESCRIPTION_SELECT,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // GET /prescriptions/:id/pdf  — DOCTOR (propia) | PATIENT (propia) | ADMIN
  // ---------------------------------------------------------------------------
  async generatePdf(id: string, user: RequestUser): Promise<Buffer> {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        author: {
          include: { user: { select: { name: true, email: true } } },
        },
        patient: {
          include: { user: { select: { name: true, email: true } } },
        },
        items: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException(`Prescripcion con id "${id}" no encontrada`);
    }

    await this.assertOwnership(
      {
        author: {
          id: prescription.authorId,
          user: prescription.author.user,
        },
        patient: {
          id: prescription.patientId,
          user: prescription.patient.user,
        },
      },
      user,
    );

    const pdfData: PrescriptionPdfData = {
      code: prescription.code,
      createdAt: prescription.createdAt,
      notes: prescription.notes,
      doctor: {
        name: prescription.author.user.name,
        licenseNumber: prescription.author.licenseNumber,
        specialty: prescription.author.specialty,
      },
      patient: {
        name: prescription.patient.user.name,
        email: prescription.patient.user.email,
        birthDate: prescription.patient.birthDate,
      },
      items: prescription.items.map((item) => ({
        medication: item.medication,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      })),
    };

    return this.pdfService.generatePrescriptionPdf(pdfData);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private generateCode(): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const short = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
    return `RX-${ymd}-${short}`;
  }

  private async assertOwnership(
    prescription: { author: { id?: string; user?: { name?: string } }; patient: { id?: string; user?: { name?: string } } },
    user: RequestUser,
  ): Promise<void> {
    if (user.role === Role.ADMIN) return;

    if (user.role === Role.DOCTOR) {
      const doctorProfile = await this.prisma.doctor.findUnique({ where: { userId: user.id } });
      if (!doctorProfile || prescription.author.id !== doctorProfile.id) {
        throw new ForbiddenException("No tienes permiso para acceder a esta prescripcion");
      }
      return;
    }

    if (user.role === Role.PATIENT) {
      const patientProfile = await this.prisma.patient.findUnique({ where: { userId: user.id } });
      if (!patientProfile || prescription.patient.id !== patientProfile.id) {
        throw new ForbiddenException("No tienes permiso para acceder a esta prescripcion");
      }
      return;
    }

    throw new ForbiddenException("Acceso denegado");
  }
}
