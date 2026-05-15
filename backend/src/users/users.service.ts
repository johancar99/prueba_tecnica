import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from '../common/interfaces/paginated-response.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

const SALT_ROUNDS = 10;

/** Campos de usuario que se retornan al cliente — nunca incluye password */
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  doctor: {
    select: {
      id: true,
      licenseNumber: true,
      specialty: true,
    },
  },
  patient: {
    select: {
      id: true,
      birthDate: true,
      phone: true,
      address: true,
    },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // GET /users
  // ---------------------------------------------------------------------------
  async findAll(query: QueryUsersDto): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, role, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as unknown as Prisma.EnumRoleFilter }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return buildPaginatedResponse(users, total, page, limit);
  }

  // ---------------------------------------------------------------------------
  // GET /users/:id
  // ---------------------------------------------------------------------------
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con id "${id}" no encontrado`);
    }

    return user;
  }

  // ---------------------------------------------------------------------------
  // POST /users
  // ---------------------------------------------------------------------------
  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    if (dto.role === Role.DOCTOR && !dto.licenseNumber) {
      throw new BadRequestException('El número de licencia es obligatorio para el rol DOCTOR');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role,
        ...(dto.role === Role.DOCTOR && {
          doctor: {
            create: {
              licenseNumber: dto.licenseNumber!,
              specialty: dto.specialty ?? null,
            },
          },
        }),
        ...(dto.role === Role.PATIENT && {
          patient: {
            create: {
              birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
              phone: dto.phone ?? null,
              address: dto.address ?? null,
            },
          },
        }),
      },
      select: USER_SELECT,
    });

    return user;
  }

  // ---------------------------------------------------------------------------
  // PATCH /users/:id
  // ---------------------------------------------------------------------------
  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id "${id}" no encontrado`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(user.role === Role.DOCTOR &&
          dto.specialty !== undefined && {
            doctor: { update: { specialty: dto.specialty } },
          }),
        ...(user.role === Role.PATIENT && {
          patient: {
            update: {
              ...(dto.birthDate !== undefined && {
                birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
              }),
              ...(dto.phone !== undefined && { phone: dto.phone }),
              ...(dto.address !== undefined && { address: dto.address }),
            },
          },
        }),
      },
      select: USER_SELECT,
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // DELETE /users/:id
  // ---------------------------------------------------------------------------
  async remove(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuario con id "${id}" no encontrado`);
    }

    await this.prisma.user.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // GET /doctors  (listado paginado con perfil)
  // ---------------------------------------------------------------------------
  async findDoctors(pagination: PaginationDto): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
      this.prisma.doctor.findMany({
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.doctor.count(),
    ]);

    return buildPaginatedResponse(doctors, total, page, limit);
  }

  // ---------------------------------------------------------------------------
  // GET /patients  (listado paginado con perfil + búsqueda opcional)
  // ---------------------------------------------------------------------------
  async findPatients(
    pagination: PaginationDto & { search?: string },
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, search } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.PatientWhereInput = search
      ? {
          user: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        }
      : {};

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true, role: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.patient.count({ where }),
    ]);

    return buildPaginatedResponse(patients, total, page, limit);
  }
}
