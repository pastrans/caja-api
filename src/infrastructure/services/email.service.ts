import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
  attachements?: Attachement[];
}

export interface Attachement {
  filename: string;
  path: string;
}

export interface EmailServiceOptions {
  mailerHost?: string;
  mailerPort?: number;
  mailerEmail: string;
  senderEmailPassword: string;
  postToProvider: boolean;
}


export class EmailService {
  private readonly mailerEmail: string;
  private readonly postToProvider: boolean;
  private transporter: Transporter;

 constructor(options: EmailServiceOptions) {
    const {
      mailerHost = 'smtp.gmail.com',
      mailerPort = 587,
      mailerEmail,
      senderEmailPassword,
      postToProvider,
    } = options;

    this.mailerEmail = mailerEmail;
    this.postToProvider = postToProvider;

    const transportOptions: SMTPTransport.Options = {
      host: mailerHost,
      port: mailerPort,
      secure: mailerPort === 465,
      auth: {
        user: mailerEmail,
        pass: senderEmailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    // Pasamos options con soporte de socket IPv4 sin choques de tipo
    this.transporter = nodemailer.createTransport({
      ...transportOptions,
      family: 4,
    } as SMTPTransport.Options);
  }


 async sendEmail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, htmlBody, attachements = [] } = options;

    try {
      if (!this.postToProvider) return true;

      await this.transporter.sendMail({
        from: this.mailerEmail,
        to: to,
        subject: subject,
        html: htmlBody,
        attachments: attachements,
      });

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  }


}