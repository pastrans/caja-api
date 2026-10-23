export interface SendMailOptions {
  to: string | string[];
  subject: string;
  htmlBody: string;
}

// Contrato para enviar correos; la implementación (SendGrid) vive en infrastructure
export interface EmailSender {
  sendEmail(options: SendMailOptions): Promise<boolean>;
}
