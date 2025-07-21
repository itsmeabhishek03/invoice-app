// src/app/invoices/[id]/edit/page.tsx
import EditInvoiceForm from './EditInvoiceForm';

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  // params.id is a plain string here in the server component
  return <EditInvoiceForm params={{ id: params.id }} />;
}
