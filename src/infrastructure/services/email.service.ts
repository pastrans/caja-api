import sgMail from '@sendgrid/mail';
import { EmailSender, SendMailOptions } from '../../domain';

export interface EmailServiceOptions {
  apiKey: string;
  mailerEmail: string;
  senderName?: string;
  postToProvider: boolean;
}

export class EmailService implements EmailSender {
  private readonly mailerEmail: string;
  private readonly senderName: string;
  private readonly postToProvider: boolean;

  constructor(options: EmailServiceOptions) {
    const {
      apiKey,
      mailerEmail,
      senderName = 'POS System',
      postToProvider,
    } = options;

    this.mailerEmail = mailerEmail;
    this.senderName = senderName;
    this.postToProvider = postToProvider;

    // Sin envío real no se configura SendGrid (la API key puede venir vacía en desarrollo)
    if (postToProvider) sgMail.setApiKey(apiKey);
  }

  async sendEmail(options: SendMailOptions): Promise<boolean> {
    const { to, subject, htmlBody } = options;

    try {
      if (!this.postToProvider) return true;

      await sgMail.send({
        to: to,
        from: {
          email: this.mailerEmail,
          name: this.senderName,
        },
        subject: subject,
        html: htmlBody,
      });

      return true;
    } catch (error: any) {
      console.error('Email send error via SendGrid API:', error?.response?.body || error);
      return false;
    }
  }
}