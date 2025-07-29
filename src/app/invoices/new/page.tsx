/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
    
    setIsGeneratingPdf(true);
    try {
      // Generate the HTML for the PDF
      const html = `
        <div class="invoice-container bg-white p-6 rounded shadow-sm">
          <div class="flex justify-between items-start mb-8">
            <div>
              ${logoBase64 ? `<img src="${logoBase64}" alt="${companyName}" class="h-16 w-auto object-contain mb-2" />` : ''}
              <h1 class="text-xl font-bold">${companyName}</h1>
            </div>
            <div class="text-right">
              <h2 class="text-2xl font-bold">INVOICE</h2>
              <p class="text-gray-600">#${invoiceNumber}</p>
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
      a.download = `invoice_${invoiceNumber}.pdf`;
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
    const res = await fetch('/api/invoices', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    if (res.ok) router.push('/invoices');
    else alert('Failed to save invoice');
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Form Section */}
      <div className="w-1/2 p-6 overflow-auto bg-gray-50 space-y-6">
        <h1 className="text-2xl font-semibold">New Invoice</h1>
        
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
        
        <div className="grid grid-cols-3 gap-4">
          <Input label="Invoice #" value={invoiceNumber} readOnly />
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
                    <Input 
                      value={item.description} 
                      onChange={e => updateItem(item.id,'description',e.target.value)} 
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateItem(item.id,'quantity',+e.target.value)} 
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.rate} 
                      onChange={e => updateItem(item.id,'rate',+e.target.value)} 
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number" 
                      value={item.tax} 
                      onChange={e => updateItem(item.id,'tax',+e.target.value)} 
                    />
                  </td>
                  <td className="p-2 text-right">
                    {(item.quantity * item.rate * (1 + item.tax/100)).toFixed(2)}
                  </td>
                  <td className="p-2 text-center">
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="secondary" onClick={addItem} className="mt-2">
            + Add Item
          </Button>
        </div>
        
        <div>
          <Input 
            label="Notes / Terms" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            //multiline 
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="w-1/2 p-6 bg-white overflow-auto">
        <div className="invoice-container bg-white p-6 rounded shadow-sm" ref={previewRef}>
          <header className="flex justify-between items-start mb-8">
            {logoBase64 && (
              <img 
                src={logoBase64} 
                alt={companyName} 
                className="h-16 w-auto object-contain mb-2"
              />
            )}
            <div className="text-right">
              <h1 className="text-xl font-bold">{companyName}</h1>
              <h2 className="text-2xl font-bold mt-1">INVOICE</h2>
              <p className="text-gray-600">#{invoiceNumber}</p>
            </div>
          </header>

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

      {/* Action Buttons */}
      <div className="fixed bottom-4 right-4 space-x-2">
        <Button 
          onClick={downloadPdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
        </Button>
        <Button onClick={saveInvoice}>
          Save Invoice
        </Button>
      </div>
    </div>
  );
}