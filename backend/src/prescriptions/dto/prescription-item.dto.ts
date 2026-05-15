import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class PrescriptionItemDto {
  @ApiProperty({ example: "Ibuprofeno 400mg", description: "Nombre del medicamento" })
  @IsString()
  @IsNotEmpty()
  medication: string;

  @ApiProperty({ example: "400mg", description: "Dosis por toma" })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: "Cada 8 horas", description: "Frecuencia de administracion" })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: "7 dias", description: "Duracion del tratamiento" })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({ example: "Tomar con alimentos", description: "Instrucciones adicionales" })
  @IsOptional()
  @IsString()
  instructions?: string;
}
