import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { PatientsController } from './patients.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [PatientsController],
})
export class PatientsModule {}
