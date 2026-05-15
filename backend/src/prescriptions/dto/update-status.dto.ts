import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

export enum AllowedStatusUpdate {
  consumed = "consumed",
  completed = "completed",
  cancelled = "cancelled",
}

export class UpdateStatusDto {
  @ApiProperty({
    enum: AllowedStatusUpdate,
    example: "consumed",
    description: "Nuevo estado de la prescripcion. El paciente solo puede marcar como consumed."
  })
  @IsEnum(AllowedStatusUpdate)
  status: AllowedStatusUpdate;
}
