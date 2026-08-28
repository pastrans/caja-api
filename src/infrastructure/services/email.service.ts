import nodemailer, { Transporter } from 'nodemailer';

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

    this.transporter = nodemailer.createTransport({
      host: mailerHost,
      port: mailerPort,
      secure: mailerPort === 465, // true para 465 (SSL), false para 587 (TLS/STARTTLS)
      auth: {
        user: mailerEmail,
        pass: senderEmailPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
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