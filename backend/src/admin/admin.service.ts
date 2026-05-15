import { Injectable } from '@nestjs/common';
import { PrescriptionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryMetricsDto } from './dto/query-metrics.dto';

interface DayRow {
  day: Date;
  count: bigint;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(query: QueryMetricsDto = {}) {
    const { from, to } = query;
    const prescriptionDateFilter = this.buildCreatedAtFilter(from, to);
    const doctorDateFilter = this.buildCreatedAtFilter(from, to);
    const patientDateFilter = this.buildCreatedAtFilter(from, to);
    const seriesBounds = this.resolveSeriesBounds(from, to);

    const [totals, statusGroups, rawByDay, topDoctorsRaw] = await Promise.all([
      this.getTotals(prescriptionDateFilter, doctorDateFilter, patientDateFilter),
      this.getByStatus(prescriptionDateFilter),
      this.getRawByDay(seriesBounds.start, seriesBounds.end),
      this.getTopDoctors(prescriptionDateFilter),
    ]);

    return {
      totals,
      byStatus: this.buildStatusMap(statusGroups),
      byDay: this.buildDaySeries(rawByDay, seriesBounds.start, seriesBounds.end),
      topDoctors: topDoctorsRaw,
    };
  }

  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------
  private buildCreatedAtFilter(
    from?: string,
    to?: string,
  ): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    return {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(`${to}T23:59:59.999Z`) }),
    };
  }

  private resolveSeriesBounds(from?: string, to?: string): { start: Date; end: Date } {
    const end = to
      ? new Date(`${to}T23:59:59.999Z`)
      : (() => {
          const d = new Date();
          d.setUTCHours(23, 59, 59, 999);
          return d;
        })();

    const start = from
      ? new Date(from)
      : (() => {
          const s = new Date(end);
          s.setUTCHours(0, 0, 0, 0);
          s.setUTCDate(s.getUTCDate() - 29);
          return s;
        })();

    return { start, end };
  }

  // ---------------------------------------------------------------------------
  // Totals
  // ---------------------------------------------------------------------------
  private async getTotals(
    prescriptionFilter?: Prisma.DateTimeFilter,
    doctorFilter?: Prisma.DateTimeFilter,
    patientFilter?: Prisma.DateTimeFilter,
  ) {
    const [doctors, patients, prescriptions] = await Promise.all([
      this.prisma.doctor.count({
        where: doctorFilter ? { createdAt: doctorFilter } : undefined,
      }),
      this.prisma.patient.count({
        where: patientFilter ? { createdAt: patientFilter } : undefined,
      }),
      this.prisma.prescription.count({
        where: prescriptionFilter ? { createdAt: prescriptionFilter } : undefined,
      }),
    ]);
    return { doctors, patients, prescriptions };
  }

  // ---------------------------------------------------------------------------
  // By status
  // ---------------------------------------------------------------------------
  private getByStatus(prescriptionFilter?: Prisma.DateTimeFilter) {
    return this.prisma.prescription.groupBy({
      by: ['status'],
      where: prescriptionFilter ? { createdAt: prescriptionFilter } : undefined,
      _count: { _all: true },
    });
  }

  private buildStatusMap(
    groups: Array<{ status: PrescriptionStatus; _count: { _all: number } }>,
  ): Record<PrescriptionStatus, number> {
    const base: Record<PrescriptionStatus, number> = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      consumed: 0,
    };
    for (const g of groups) {
      base[g.status] = g._count._all;
    }
    return base;
  }

  // ---------------------------------------------------------------------------
  // Time series
  // ---------------------------------------------------------------------------
  private getRawByDay(start: Date, end: Date): Promise<DayRow[]> {
    return this.prisma.$queryRaw<DayRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::bigint               AS count
      FROM prescriptions
      WHERE "createdAt" >= ${start}
        AND "createdAt" <= ${end}
      GROUP BY day
      ORDER BY day ASC
    `;
  }

  private buildDaySeries(
    rows: DayRow[],
    start: Date,
    end: Date,
  ): Array<{ date: string; count: number }> {
    const lookup = new Map<string, number>();
    for (const row of rows) {
      const key = row.day.toISOString().slice(0, 10);
      lookup.set(key, Number(row.count));
    }

    const series: Array<{ date: string; count: number }> = [];
    const cursor = new Date(start);
    cursor.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setUTCHours(0, 0, 0, 0);

    while (cursor <= endDay) {
      const key = cursor.toISOString().slice(0, 10);
      series.push({ date: key, count: lookup.get(key) ?? 0 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return series;
  }

  // ---------------------------------------------------------------------------
  // Top doctors (prescription count within date range)
  // ---------------------------------------------------------------------------
  private async getTopDoctors(
    prescriptionFilter?: Prisma.DateTimeFilter,
    take = 10,
  ) {
    const where = prescriptionFilter
      ? { createdAt: prescriptionFilter }
      : undefined;

    const groups = (
      await this.prisma.prescription.groupBy({
        by: ["authorId"],
        where,
        _count: { _all: true },
      })
    )
      .sort((a, b) => b._count._all - a._count._all)
      .slice(0, take);

    if (groups.length === 0) return [];

    const doctorIds = groups.map((g) => g.authorId);
    const doctors = await this.prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      select: {
        id: true,
        licenseNumber: true,
        specialty: true,
        user: { select: { name: true, email: true } },
      },
    });

    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    return groups
      .map((g) => {
        const d = doctorMap.get(g.authorId);
        if (!d) return null;
        return {
          doctorId: d.id,
          licenseNumber: d.licenseNumber,
          specialty: d.specialty,
          name: d.user.name,
          email: d.user.email,
          prescriptionsCount: g._count._all,
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }
}
