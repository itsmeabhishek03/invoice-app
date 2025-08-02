// app/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6">
        Welcome to InvoiceApp
      </h1>
      <p className="text-gray-700 mb-8 max-w-md text-center">
        Create, send, and track your invoices—quickly and easily.
      </p>
      <div className="space-x-4">
        <Link href="/invoices">
          <Button >Get Started</Button>
        </Link>
        <Link href="/settings">
          <Button variant="secondary">Learn More</Button>
        </Link>
      </div>
    </main>
  );
}
