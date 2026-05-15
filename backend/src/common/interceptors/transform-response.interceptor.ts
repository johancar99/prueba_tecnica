import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginationMeta } from '../interfaces/paginated-response.interface';

interface PaginatedBody<T> {
  data: T[];
  meta: PaginationMeta;
}

function isPaginated<T>(value: unknown): value is PaginatedBody<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Array.isArray((value as PaginatedBody<T>).data) &&
    typeof (value as PaginatedBody<T>).meta === 'object' &&
    (value as PaginatedBody<T>).meta !== null
  );
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T | T[];
  meta?: PaginationMeta;
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((value): unknown => {
        // Let 204 No Content pass through untouched
        if (value === undefined || value === null) {
          return value;
        }

        const statusCode = response.statusCode;

        if (isPaginated(value)) {
          return {
            statusCode,
            message: 'OK',
            data: value.data,
            meta: value.meta,
          } satisfies ApiResponse;
        }

        return {
          statusCode,
          message: 'OK',
          data: value,
        } satisfies ApiResponse;
      }),
    );
  }
}
