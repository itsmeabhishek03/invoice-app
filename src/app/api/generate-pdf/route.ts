// src/app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  const { html } = await request.json();

  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <title>Invoice PDF</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          /* A4 margins only */
          @page { margin: 20mm; }
          /* Reset */
          *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
          body { background:white; }
          /* Force container to printable width */
          .invoice-container {
            width: 170mm;            /* 210mm - 2×20mm */
            padding: 6mm;            /* match on-screen padding */
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

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Render the invoice HTML
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

  // Measure the height of the container in pixels
  const containerHeightPx = await page.$eval(
    '.invoice-container',
    (el) => el.getBoundingClientRect().height
  );

  // Convert pixels to mm (assuming 96 DPI: 1px ≈ 0.264583 mm)
  const pxToMm = (px: number) => (px * 25.4) / 96;
  const contentHeightMm = pxToMm(containerHeightPx);

  // Generate PDF sized to content
  const pdfBuffer = await page.pdf({
    printBackground: true,
    width: '170mm',                             // content width
    height: `${contentHeightMm + 12}mm`,        // content height + small padding
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
  });

  await browser.close();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="invoice.pdf"',
    },
  });
}
