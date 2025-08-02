// components/ui/Navbar.tsx
'use client';

import Link from 'next/link';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar';
import { useProfile } from '@/components/ProfileContext';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { data: session, status } = useSession();
  const profile = useProfile();

  if (status === 'loading') return null;

  if (!session) {
    return (
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold">InvoiceApp</span>
          {/* Use signIn() instead of Link */}
          <Button onClick={() => signIn()}>
            Sign In
          </Button>
        </div>
      </nav>
    );
  } 

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          {profile.logoBase64 ? (
            <img
              src={profile.logoBase64}
              alt="Logo"
              className="h-8 w-8 object-contain rounded"
            />
          ) : (
            <span className="h-8 w-8 bg-gray-200 rounded" />
          )}
          <span className="text-xl font-bold">
            {profile.companyName || 'InvoiceApp'}
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/invoices" className="hover:underline">
            Invoices
          </Link>
          <Link href="/invoices/new" className="hover:underline">
            + New Invoice
          </Link>
          <Link href="/settings" className="hover:underline">
            Settings
          </Link>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 focus:outline-none">
              <Avatar src={profile.logoBase64} />
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-40 bg-white shadow-md rounded-md py-1">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    href="/profile"
                    className={`block px-4 py-2 text-sm ${
                      active ? 'bg-gray-100' : ''
                    }`}
                  >
                    Profile
                  </Link>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      active ? 'bg-gray-100' : ''
                    }`}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </nav>
  );
}
