import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "path";
import { MailService } from "./mail.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>("MAIL_HOST"),
          port: Number(config.get<string>("MAIL_PORT")) || 587,
          secure: Number(config.get<string>("MAIL_PORT")) === 465,
          auth: {
            user: config.get<string>("MAIL_USER"),
            pass: config.get<string>("MAIL_PASS"),
          },
        },
        defaults: {
          from: config.get<string>("MAIL_FROM"),
        },
        template: {
          dir: join(__dirname, "templates"),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
