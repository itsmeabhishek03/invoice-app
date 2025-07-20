// src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import ProfileProvider from '@/components/ProfileContext'; // now default
import Navbar from '@/components/ui/Navbar';

export const metadata = { title: 'InvoiceApp' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <script async src="https://cdn.tailwindcss.com"></script>
      <body>
        <Providers>
          <ProfileProvider>
            <Navbar />
            {children}
          </ProfileProvider>
        </Providers>
      </body>
    </html>
  );
}
