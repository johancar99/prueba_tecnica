import { Injectable } from '@nestjs/common';
import { PrescriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface DayRow {
  day: Date;
  count: bigint;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [totals, statusGroups, rawByDay, topDoctorsRaw] = await Promise.all([
      this.getTotals(),
      this.getByStatus(),
      this.getRawByDay(),
      this.getTopDoctors(),
    ]);

    return {
      totals,
      byStatus: this.buildStatusMap(statusGroups),
      byDay: this.buildDaySeries(rawByDay),
      topDoctors: topDoctorsRaw,
    };
  }

  // ---------------------------------------------------------------------------
  // Totals — parallel counts
  // ---------------------------------------------------------------------------
  private async getTotals() {
    const [doctors, patients, prescriptions] = await Promise.all([
      this.prisma.doctor.count(),
      this.prisma.patient.count(),
      this.prisma.prescription.count(),
    ]);
    return { doctors, patients, prescriptions };
  }

  // ---------------------------------------------------------------------------
  // By status — single groupBy query
  // ---------------------------------------------------------------------------
  private getByStatus() {
    return this.prisma.prescription.groupBy({
      by: ['status'],
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
  // Time series — last 30 days, one row per calendar day (UTC)
  // Raw SQL needed because Prisma groupBy does not support date truncation.
  // ---------------------------------------------------------------------------
  private getRawByDay(): Promise<DayRow[]> {
    return this.prisma.$queryRaw<DayRow[]>`
      SELECT
        DATE_TRUNC('day', "createdAt") AS day,
        COUNT(*)::bigint               AS count
      FROM prescriptions
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `;
  }

  private buildDaySeries(rows: DayRow[]): Array<{ date: string; count: number }> {
    // Build a lookup: "YYYY-MM-DD" → count
    const lookup = new Map<string, number>();
    for (const row of rows) {
      const key = row.day.toISOString().slice(0, 10);
      lookup.set(key, Number(row.count));
    }

    // Generate all 30 days (today inclusive) and fill gaps with 0
    const series: Array<{ date: string; count: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, count: lookup.get(key) ?? 0 });
    }
    return series;
  }

  // ---------------------------------------------------------------------------
  // Top doctors — Prisma relation-count orderBy (no raw SQL needed)
  // ---------------------------------------------------------------------------
  private async getTopDoctors(take = 10) {
    const doctors = await this.prisma.doctor.findMany({
      take,
      orderBy: { prescriptions: { _count: 'desc' } },
      select: {
        id: true,
        licenseNumber: true,
        specialty: true,
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: { prescriptions: true },
        },
      },
    });

    return doctors.map((d) => ({
      doctorId: d.id,
      licenseNumber: d.licenseNumber,
      specialty: d.specialty,
      name: d.user.name,
      email: d.user.email,
      prescriptionsCount: d._count.prescriptions,
    }));
  }
}
