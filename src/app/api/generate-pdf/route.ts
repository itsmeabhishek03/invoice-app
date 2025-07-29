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
          /* Reset all margins/padding */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          /* Set base font for consistent sizing */
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            color: #1f2937;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Main container styling */
          .invoice-container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 1.5rem;
          }
          
          /* Ensure images maintain aspect ratio */
          img {
            max-width: 100%;
            height: auto;
          }
          
          /* Table styling */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
          }
          
          th, td {
            padding: 0.5rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          th {
            background-color: #f3f4f6;
            font-weight: 600;
          }
          
          /* Totals section */
          .totals {
            width: 100%;
            max-width: 300px;
            margin-left: auto;
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
    headless: true // Use new Headless mode for better performance
  });
  
  const page = await browser.newPage();
  
  // Set viewport to a reasonable size
  await page.setViewport({
    width: 1200,
    height: 1200,
    deviceScaleFactor: 2 // Higher resolution for better quality
  });

  await page.setContent(fullHtml, {
    waitUntil: 'networkidle0',
    timeout: 30000 // Increase timeout for complex invoices
  });

  // Calculate exact height needed
  const { height } = await page.evaluate(() => {
    const container = document.querySelector('.invoice-container');
    if (!container) return { height: 0 };
    const { height } = container.getBoundingClientRect();
    return { height };
  });

  // Generate PDF with precise dimensions
  const pdfBuffer = await page.pdf({
    printBackground: true,
    width: '8.5in',
    height: `${Math.max(height / 96, 11)}in`, // 96 DPI conversion with minimum of 11in
    margin: {
      top: '0.5in',
      bottom: '0.5in',
      left: '0.5in',
      right: '0.5in'
    },
    scale: 0.9 // Slight scaling to ensure content fits
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