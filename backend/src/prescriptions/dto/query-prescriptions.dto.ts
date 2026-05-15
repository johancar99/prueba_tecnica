import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "../../common/dto/pagination.dto";

export enum PrescriptionStatusFilter {
  pending = "pending",
  completed = "completed",
  cancelled = "cancelled",
  consumed = "consumed",
}

export class QueryPrescriptionsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: PrescriptionStatusFilter,
    example: "pending",
    description: "Filtrar por estado de la prescripcion"
  })
  @IsOptional()
  @IsEnum(PrescriptionStatusFilter)
  status?: PrescriptionStatusFilter;

  @ApiPropertyOptional({ example: "2026-01-01", description: "Desde esta fecha (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: "2026-12-31", description: "Hasta esta fecha (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  to?: string;
}
