'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function EditInvoiceForm({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const { companyName, logoBase64 } = useProfile();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then((data: Invoice) => {
        setInvoice(data);
        setClientName(data.clientName);
        setClientEmail(data.clientEmail);
        setIssueDate(data.issueDate);
        setDueDate(data.dueDate);
        setNotes(data.notes || '');
        setItems(data.items.map((it, i) => ({ ...it, id: i + 1 })));
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  async function handleSendInvoice() {
    if (!invoice || !confirm(`Send invoice to ${clientEmail}?`)) return;
    
    setIsSending(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      alert('Invoice sent successfully!');
      const updatedInvoice = await fetch(`/api/invoices/${invoiceId}`).then(res => res.json());
      setInvoice(updatedInvoice);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsSending(false);
    }
  }

  if (loading) return <p className="p-8">Loading…</p>;
  if (!invoice) return <p className="p-8">Invoice not found.</p>;

  const addItem = () =>
    setItems(prev => [
      ...prev,
      { id: prev.length + 1, description: '', quantity: 1, rate: 0, tax: 0 },
    ]);
  const updateItem = (
    id: number,
    field: keyof Omit<LineItem, 'id'>,
    value: string | number
  ) =>
    setItems(prev =>
      prev.map(it => (it.id === id ? { ...it, [field]: value } : it))
    );
  const removeItem = (id: number) =>
    setItems(prev => prev.filter(it => it.id !== id));

  const subtotal = items.reduce((s, { quantity, rate }) => s + quantity * rate, 0);
  const totalTax = items.reduce(
    (s, { quantity, rate, tax }) => s + (quantity * rate * tax) / 100,
    0
  );
  const total = subtotal + totalTax;

  async function onSave() {
    const payload = {
      ...invoice,
      clientName,
      clientEmail,
      issueDate,
      dueDate,
      notes,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      items: items.map(({ id, ...rest }) => rest),
    };
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push('/invoices');
    else alert('Failed to save');
  }

  async function onDelete() {
    if (!confirm('Delete this invoice?')) return;
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'DELETE',
    });
    if (res.ok) router.push('/invoices');
    else alert('Failed to delete');
  }

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      const html = `
        <div class="invoice-container bg-white p-6 rounded shadow-sm">
          <div class="flex justify-between items-start mb-8">
            <div>
              ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}" class="h-16 w-auto object-contain mb-2" />` : ''}
              <h1 class="text-xl font-bold">${companyName}</h1>
            </div>
            <div class="text-right">
              <h2 class="text-2xl font-bold">INVOICE</h2>
              <p class="text-gray-600">#${invoice?.invoiceNumber}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 class="font-semibold text-gray-700 mb-2">Bill To</h3>
              <p class="font-medium">${clientName}</p>
              <p class="text-gray-600">${clientEmail}</p>
            </div>
            <div class="text-right">
              <p><span class="text-gray-600">Issued:</span> ${issueDate}</p>
              <p><span class="text-gray-600">Due:</span> ${dueDate}</p>
            </div>
          </div>

          <table class="w-full mb-8">
            <thead>
              <tr class="border-b-2 border-gray-200">
                <th class="text-left py-3">Description</th>
                <th class="text-right py-3">Qty</th>
                <th class="text-right py-3">Rate</th>
                <th class="text-right py-3">Tax</th>
                <th class="text-right py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr class="border-b border-gray-100">
                  <td class="py-3">${item.description}</td>
                  <td class="text-right py-3">${item.quantity}</td>
                  <td class="text-right py-3">${item.rate.toFixed(2)}</td>
                  <td class="text-right py-3">${item.tax}%</td>
                  <td class="text-right py-3">${(item.quantity * item.rate).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="flex justify-end">
            <div class="w-64">
              <div class="flex justify-between py-2">
                <span class="text-gray-600">Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2">
                <span class="text-gray-600">Tax:</span>
                <span>${totalTax.toFixed(2)}</span>
              </div>
              <div class="flex justify-between py-2 border-t-2 border-gray-200 font-bold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${notes ? `
            <div class="mt-8 pt-4 border-t border-gray-200">
              <h3 class="font-semibold text-gray-700 mb-2">Notes</h3>
              <p class="text-gray-600 whitespace-pre-line">${notes}</p>
            </div>
          ` : ''}
        </div>
      `;

      const res = await fetch('/api/generate-pdf', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ html }) 
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="flex flex-col p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Edit Invoice</h1>
        <div className="space-x-2">
          <Button
            onClick={handleSendInvoice}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Invoice'}
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form Section */}
        <div className="lg:w-1/2 bg-gray-50 p-6 rounded space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Name"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
            <Input
              label="Client Email"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={e => setIssueDate(e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

           <div>
    <h2 className="text-lg font-medium mb-2">Line Items</h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Qty</th>
            <th className="p-2 text-left">Rate</th>
            <th className="p-2 text-left">Tax %</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b">
              <td className="p-2">
                <Input
                  value={item.description}
                  onChange={e =>
                    updateItem(item.id, 'description', e.target.value)
                  }
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={e =>
                    updateItem(item.id, 'quantity', Number(e.target.value))
                  }
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={item.rate}
                  onChange={e =>
                    updateItem(item.id, 'rate', Number(e.target.value))
                  }
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={item.tax}
                  onChange={e =>
                    updateItem(item.id, 'tax', Number(e.target.value))
                  }
                />
              </td>
              <td className="p-2 text-right">
                {(item.quantity * item.rate).toFixed(2)}
              </td>
              <td className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Button variant="secondary" onClick={addItem} className="mt-2">
      + Add Item
    </Button>
  </div>

    

          <Input
            label="Notes / Terms"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Totals section */}
          <div className="bg-white p-4 rounded shadow-sm w-full md:w-1/2 ml-auto">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Tax</span>
              <span>{totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-t font-semibold">
              <span>Total</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:w-1/2 bg-white p-6 rounded shadow-sm">
          <div className="invoice-container">
            <div className="flex justify-between items-start mb-8">
              <div>
                {logoBase64 && (
                  <img 
                    src={logoBase64} 
                    alt={companyName} 
                    className="h-16 w-auto object-contain mb-2"
                  />
                )}
                <h1 className="text-xl font-bold">{companyName}</h1>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold">INVOICE</h2>
                <p className="text-gray-600">#{invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Bill To</h3>
                <p className="font-medium">{clientName}</p>
                <p className="text-gray-600">{clientEmail}</p>
              </div>
              <div className="text-right">
                <p><span className="text-gray-600">Issued:</span> {issueDate}</p>
                <p><span className="text-gray-600">Due:</span> {dueDate}</p>
              </div>
            </div>

            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3">Description</th>
                  <th className="text-right py-3">Qty</th>
                  <th className="text-right py-3">Rate</th>
                  <th className="text-right py-3">Tax</th>
                  <th className="text-right py-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3">{item.description}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">{item.rate.toFixed(2)}</td>
                    <td className="text-right py-3">{item.tax}%</td>
                    <td className="text-right py-3">{(item.quantity * item.rate).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Tax:</span>
                  <span>{totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-gray-200 font-bold">
                  <span>Total:</span>
                  <span>{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {notes && (
              <div className="mt-8 pt-4 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-600 whitespace-pre-line">{notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
        </Button>
        <Button onClick={onSave}>Save Changes</Button>
      </div>
    </div>
  );
}