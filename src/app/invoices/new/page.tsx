'use client';
import { useState, useRef } from 'react';
import { useProfile } from '@/components/ProfileContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';

type LineItem = {
  id: number;
  description: string;
  quantity: number;
  rate: number;
  tax: number;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const { companyName, logoBase64 } = useProfile();
  const previewRef = useRef<HTMLDivElement>(null);

  const [invoiceNumber] = useState(() => `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${nanoid(8)}`);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10));
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10));
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ id: 1, description: '', quantity: 1, rate: 0, tax: 0 }]);

  const addItem = () => setItems(prev => [...prev, { id: prev.length+1, description: '', quantity: 1, rate: 0, tax: 0 }]);
  const removeItem = (id: number) => setItems(prev => prev.filter(it => it.id !== id));
  const updateItem = (id: number, field: keyof Omit<LineItem,'id'>, value: string | number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));

  const subtotal = items.reduce((sum, { quantity, rate }) => sum + quantity * rate, 0);
  const totalTax = items.reduce((sum, { quantity, rate, tax }) => sum + (quantity * rate * tax)/100, 0);
  const total = subtotal + totalTax;

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    const html = previewRef.current.outerHTML;
    const res = await fetch('/api/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html }) });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  async function saveInvoice() {
    const payload = {
      clientName,
      clientEmail,
      invoiceNumber,
      issueDate,
      dueDate,
      notes,
      items: items.map(({ id, ...rest }) => rest),
      subtotal,
      totalTax,
      total,
      companyName,
      logoBase64,
    };
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) router.push('/invoices');
    else alert('Failed to save invoice');
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="w-1/2 p-6 overflow-auto bg-gray-50 space-y-6">
        <h1 className="text-2xl font-semibold">New Invoice</h1>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Client Name" value={clientName} onChange={e => setClientName(e.target.value)} />
          <Input label="Client Email" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Invoice #" value={invoiceNumber} readOnly />
          <Input label="Issue Date" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
          <Input label="Due Date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <div>
          <h2 className="text-lg font-medium mb-2">Line Items</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Description</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Rate</th>
                <th className="p-2">Tax %</th>
                <th className="p-2">Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    <Input value={item.description} onChange={e => updateItem(item.id,'description',e.target.value)} />
                  </td>
                  <td className="p-2">
                    <Input type="number" value={item.quantity} onChange={e => updateItem(item.id,'quantity',+e.target.value)} />
                  </td>
                  <td className="p-2">
                    <Input type="number" value={item.rate} onChange={e => updateItem(item.id,'rate',+e.target.value)} />
                  </td>
                  <td className="p-2">
                    <Input type="number" value={item.tax} onChange={e => updateItem(item.id,'tax',+e.target.value)} />
                  </td>
                  <td className="p-2 text-right">{(item.quantity * item.rate * (1 + item.tax/100)).toFixed(2)}</td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeItem(item.id)}>&times;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="secondary" onClick={addItem}>+ Add Item</Button>
        </div>
        <div>
          <Input label="Notes / Terms" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="w-1/2 p-6 bg-white overflow-auto" ref={previewRef}>
        <div className="p-6 border rounded shadow-sm">
          <header className="flex justify-between items-center mb-6">
            {logoBase64 && <img src={logoBase64} alt="Logo" className="h-12 w-12 object-contain" />}
            <div className="text-right">
              <h2 className="text-xl font-bold">{companyName}</h2>
              <p className="text-sm text-gray-600">Invoice</p>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-medium">Bill To:</h3>
              <p>{clientName}</p>
              <p>{clientEmail}</p>
            </div>
            <div className="text-right">
              <p><strong>Invoice #:</strong> {invoiceNumber}</p>
              <p><strong>Issue:</strong> {issueDate}</p>
              <p><strong>Due:</strong> {dueDate}</p>
            </div>
          </div>
          <table className="w-full text-sm mb-6">
            <thead className="border-t border-b">
              <tr>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="p-2">{item.description}</td>
                  <td className="p-2 text-right">{(item.quantity * item.rate * (1 + item.tax/100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-2 text-right">
            <p>Subtotal: <strong>{subtotal.toFixed(2)}</strong></p>
            <p>Tax: <strong>{totalTax.toFixed(2)}</strong></p>
            <p className="text-lg">Total: <strong>{total.toFixed(2)}</strong></p>
          </div>
          {notes && <div className="mt-6 text-sm"><h4 className="font-medium">Notes</h4><p>{notes}</p></div>}
        </div>
      </div>
      <div className="fixed bottom-4 right-4 space-x-2">
        <Button onClick={downloadPdf}>Download PDF</Button>
        <Button onClick={saveInvoice}>Save Invoice</Button>
      </div>
    </div>
  );
}
