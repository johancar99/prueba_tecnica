import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class QueryMetricsDto {
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Desde esta fecha (ISO 8601, inclusive)',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Hasta esta fecha (ISO 8601, inclusive)',
  })
  @IsOptional()
  @IsDateString()
  to?: string;
}
