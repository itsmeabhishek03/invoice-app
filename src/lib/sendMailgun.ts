import Mailgun from 'mailgun.js';
import formData from 'form-data';
//import type { AttachmentData } from 'mailgun.js/interfaces/attachments';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY!,
  //url: 'https://api.mailgun.net',
});

interface SendInvoiceEmailParams {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  filename: string;
}

export async function sendInvoiceEmail({
  to,
  subject,
  html,
  pdfBuffer,
  filename,
}: SendInvoiceEmailParams): Promise<boolean> {
  try {
    const data = {
      from: `Your Invoice App <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to,
      subject,
      html,
      attachment: {
        filename,
        data: pdfBuffer,
      },
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN!, data);
    return true;
  } catch (error) {
    console.error('Mailgun error:', error);
    return false;
  }
}