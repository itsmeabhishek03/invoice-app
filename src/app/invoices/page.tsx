'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Invoice = {
  _id: string;
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  total: number;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    fetch('/api/invoices/list')
      .then((res) => res.json())
      .then(setInvoices);
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My Invoices</h1>
        <Link href="/invoices/new">
          <Button>New Invoice</Button>
        </Link>
      </div>

      {invoices.length === 0 ? (
        <p>No invoices yet. Click “New Invoice” to get started.</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2 text-left">#</th>
              <th className="border-b p-2 text-left">Client</th>
              <th className="border-b p-2">Date</th>
              <th className="border-b p-2 text-right">Total</th>
              <th className="border-b p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id} className="hover:bg-gray-50">
                <td className="p-2">{inv.invoiceNumber}</td>
                <td className="p-2">{inv.clientName}</td>
                <td className="p-2 text-center">{inv.issueDate}</td>
                <td className="p-2 text-right">{inv.total}</td>
                <td className="p-2 text-center">
                  <Link href={`/invoices/${inv._id}/edit`} className="underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
