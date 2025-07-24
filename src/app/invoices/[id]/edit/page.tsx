// src/app/invoices/[id]/edit/page.tsx
import EditInvoiceForm from './EditInvoiceForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditInvoicePage({ params }: PageProps) {
  // Await the params object, then destructure id
  const { id: invoiceId } = await params;

  return <EditInvoiceForm invoiceId={invoiceId} />;
}
