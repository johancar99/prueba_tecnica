import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import { PrescriptionEmailPayload } from "./interfaces/prescription-email-payload.interface";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPrescriptionCreated(payload: PrescriptionEmailPayload): Promise<void> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    const detailUrl = frontendUrl
      ? `${frontendUrl.replace(/\/$/, "")}/patient/prescriptions/${payload.prescriptionId}`
      : undefined;

    await this.mailerService.sendMail({
      to: payload.to,
      subject: `Nueva prescripción médica — ${payload.prescriptionCode}`,
      template: "prescription-created",
      context: {
        patientName: payload.patientName,
        doctorName: payload.doctorName,
        prescriptionCode: payload.prescriptionCode,
        items: payload.items,
        detailUrl,
      },
    });

    this.logger.log(
      `Notificación de prescripción ${payload.prescriptionCode} enviada a ${payload.to}`,
    );
  }
}
