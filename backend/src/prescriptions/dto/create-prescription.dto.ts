import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { PrescriptionItemDto } from "./prescription-item.dto";

export class CreatePrescriptionDto {
  @ApiProperty({ example: "cly1234patient", description: "ID del paciente (Patient.id)" })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ example: "Paciente hipertenso. Evitar AINES prolongados.", description: "Notas clinicas opcionales" })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    type: [PrescriptionItemDto],
    description: "Lista de medicamentos (minimo 1 item)",
    example: [
      {
        medication: "Ibuprofeno 400mg",
        dosage: "400mg",
        frequency: "Cada 8 horas",
        duration: "7 dias",
        instructions: "Tomar con alimentos"
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Debe incluir al menos 1 medicamento" })
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  items: PrescriptionItemDto[];
}
