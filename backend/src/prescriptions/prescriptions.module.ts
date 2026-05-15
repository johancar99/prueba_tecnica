import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { PdfModule } from "../pdf/pdf.module";
import { MailModule } from "../mail/mail.module";
import { PrescriptionsController } from "./prescriptions.controller";
import { PrescriptionsService } from "./prescriptions.service";

@Module({
  imports: [PrismaModule, AuthModule, PdfModule, MailModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
