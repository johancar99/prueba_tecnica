import { PrismaClient } from '@prisma/client';

type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminPassword = await bcrypt.hash('Admin123!', SALT_ROUNDS);
  const doctorPassword = await bcrypt.hash('Doctor123!', SALT_ROUNDS);
  const patientPassword = await bcrypt.hash('Patient123!', SALT_ROUNDS);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinica.com' },
    update: {},
    create: {
      email: 'admin@clinica.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN' as Role,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Doctor
  const doctor = await prisma.user.upsert({
    where: { email: 'doctor@clinica.com' },
    update: {},
    create: {
      email: 'doctor@clinica.com',
      password: doctorPassword,
      name: 'Dr. Juan Pérez',
      role: 'DOCTOR' as Role,
      doctor: {
        create: {
          licenseNumber: 'LIC-001',
          specialty: 'Medicina General',
        },
      },
    },
  });
  console.log(`✅ Doctor: ${doctor.email}`);

  // Patient
  const patient = await prisma.user.upsert({
    where: { email: 'paciente@clinica.com' },
    update: {},
    create: {
      email: 'paciente@clinica.com',
      password: patientPassword,
      name: 'María García',
      role: 'PATIENT' as Role,
      patient: {
        create: {
          phone: '+34 600 000 000',
        },
      },
    },
  });
  console.log(`✅ Paciente: ${patient.email}`);

  console.log('\n🎉 Seed completado.');
  console.log('📋 Cuentas de prueba:');
  console.log('   admin@clinica.com     → Admin123!');
  console.log('   doctor@clinica.com    → Doctor123!');
  console.log('   paciente@clinica.com  → Patient123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
