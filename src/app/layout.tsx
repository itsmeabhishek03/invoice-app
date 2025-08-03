// src/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import Providers from '@/components/Providers';
import ProfileProvider from '@/components/ProfileContext'; // now default
import Navbar from '@/components/ui/Navbar';
//import Pageloader from '@/components/ui/Pageloader';

export const metadata = { title: 'InvoiceApp' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      
      <script async src="https://cdn.tailwindcss.com"></script>
      <body>
        <Providers>
          <ProfileProvider>
            {/* <Pageloader /> */}
            <Navbar />
            {children}
          </ProfileProvider>
        </Providers>
      </body>
    </html>
  );
}
