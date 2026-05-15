import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { DoctorsController } from './doctors.controller';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [DoctorsController],
})
export class DoctorsModule {}
