'use client';

import { useRouter } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useEffect, useState, ChangeEvent } from 'react';
import { useProfile } from '@/components/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

type Invoice = {
  _id: string;
  clientName: string;
  clientEmail: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  items: LineItem[];
};

export default function EditInvoicePage({ params }: { params: { id: string } }) {
 // eslint-disable-next-line @typescript-eslint/no-unused-vars
 const { companyName, logoBase64 } = useProfile();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Local form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);

  // Fetch invoice
  useEffect(() => {
    fetch(`/api/invoices/${params.id}`)
      .then((res) => res.json())
      .then((data: Invoice) => {
        setInvoice(data);
        setClientName(data.clientName);
        setClientEmail(data.clientEmail);
        setNotes(data.notes || '');
        // rehydrate line items with stable IDs
        setItems(
          data.items.map((it, i) => ({ ...it, id: i + 1 }))
        );
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="p-8">Loading…</p>;
  if (!invoice) return <p className="p-8">Invoice not found.</p>;

  // Handlers for items (same as NewInvoicePage)
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: prev.length + 1, description: '', quantity: 1, rate: 0, tax: 0 },
    ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateItem = (
    id: number,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number
  ) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const removeItem = (id: number) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  // Save updates
  async function onSave() {
    const payload = {
      ...invoice,
      clientName,
      clientEmail,
      notes,
      items,
    };
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push('/invoices');
    } else {
      alert('Failed to save');
    }
  }

  // Delete
  async function onDelete() {
    if (!confirm('Delete this invoice?')) return;
    const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/invoices');
    } else {
      alert('Failed to delete');
    }
  }

  // Calculate totals (same as NewInvoicePage)
  const subtotal = items.reduce((s, { quantity, rate }) => s + quantity * rate, 0);
  const totalTax = items.reduce(
    (s, { quantity, rate, tax }) => s + (quantity * rate * tax) / 100,
    0
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const total = subtotal + totalTax;

  return (
    <div className="flex flex-col p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Edit Invoice</h1>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>

      {/* Client & items form (similar layout to NewInvoicePage’s left pane) */}
      <div className="bg-gray-50 p-6 rounded space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
          <Input label="Client Email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
        </div>

        {/* Line Items */}
        <div>
          <h2 className="text-lg font-medium mb-2">Line Items</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              {/* ...same table head as NewInvoicePage... */}
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  {/* ...same cells with inputs calling updateItem/removeItem... */}
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="secondary" onClick={addItem} className="mt-2">
            + Add Item
          </Button>
        </div>

        <div>
          <Input label="Notes / Terms" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      {/* Save button */}
      <Button onClick={onSave}>Save Changes</Button>
    </div>
  );
}
