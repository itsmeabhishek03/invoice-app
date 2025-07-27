import { NextResponse } from 'next/server';
import  getMongoClient  from '@/lib/mongodb';
//import { generatePdf } from '@/lib/generatePdf';
import { sendInvoiceEmail } from '@/lib/sendMailgun';
import { ObjectId } from 'mongodb';
import puppeteer from 'puppeteer';

async function generatePdfBuffer(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <title>Invoice PDF</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page { margin: 20mm; }
          *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
          body { background:white; }
          .invoice-container {
            width: 170mm;
            padding: 6mm;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            margin: 0 auto;
          }
          .invoice-container img {
            max-width: 120px;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${html}
        </div>
      </body>
    </html>
  `;

  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  const containerHeightPx = await page.$eval('.invoice-container', (el) => el.getBoundingClientRect().height);
  const pxToMm = (px: number) => (px * 25.4) / 96;
  const contentHeightMm = pxToMm(containerHeightPx);

  const pdfBuffer = await page.pdf({
    printBackground: true,
    width: '170mm',
    height: `${contentHeightMm + 12}mm`,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
  });

  await browser.close();
  return Buffer.from(pdfBuffer);
}


export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await getMongoClient;
    const db = client.db();
    const invoiceId = params.id;

    // Fetch invoice and profile data
    const [invoice, profile] = await Promise.all([
     db.collection('invoices').findOne({ _id: new ObjectId(invoiceId) }),
     db.collection('profiles').findOne(),
    ]);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (!profile) {
      return NextResponse.json({ error: 'Company profile not found' }, { status: 400 });
    }

    // Generate email content
    const emailHtml = `
      <html>
        <body>
          <p>Hello ${invoice.clientName},</p>
          <p>Please find your invoice #${invoice.invoiceNumber} attached.</p>
          <p>
            Amount Due: ${invoice.total.toFixed(2)}<br>
            Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
          </p>
          <p>${profile.companyName}</p>
        </body>
      </html>
    `;

    const pdfBuffer = await generatePdfBuffer(emailHtml);

    // Generate PDF HTML (same as your preview)

    // Generate PDF using your existing function
    //const pdfBlob = await generatePdf(pdfHtml);
   // const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Send email
    const success = await sendInvoiceEmail({
      to: invoice.clientEmail,
      subject: `Invoice #${invoice.invoiceNumber} from ${profile.companyName}`,
      html: emailHtml,
      pdfBuffer,
      filename: `invoice_${invoice.invoiceNumber}.pdf`,
    });

    if (!success) {
      throw new Error('Failed to send email');
    }

    // Update invoice status
    await db.collection('invoices').updateOne(
  { _id: new ObjectId(invoiceId) },
  { $set: { status: 'sent', sentAt: new Date() } }
);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send invoice error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send invoice' },
      { status: 500 }
    );
  }
}