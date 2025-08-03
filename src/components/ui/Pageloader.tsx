// components/ui/Navbar.tsx
'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from './Avatar';
import { useProfile } from '@/components/ProfileContext';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/invoices', label: 'Invoices' },
  { href: '/invoices/new', label: '+ New Invoice' },
  { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const profile = useProfile();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === 'loading') return null;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo & Title */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              {profile.logoBase64 ? (
                <img src={profile.logoBase64} alt="Logo" className="h-8 w-8 rounded-md" />
              ) : (
                <div className="h-8 w-8 bg-gray-100 rounded-md" />
              )}
              <span className="text-xl font-semibold text-gray-800">
                {profile.companyName || 'InvoiceApp'}
              </span>
            </Link>
          </div>

          {/* Desktop Links & User */}
          {session ? (
            <div className="hidden md:flex md:items-center md:space-x-6">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="
                    text-gray-600
                    hover:text-gray-900
                    px-3 py-2
                    border border-gray-300
                    rounded-md
                    text-sm font-medium
                    hover:border-gray-400
                    hover:bg-gray-50
                    transition
                  "
                >
                  {link.label}
                </Link>
              ))}

              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 focus:outline-none">
                  <Avatar src={profile.logoBase64} />
                  <span className="text-sm text-gray-700">{session.user?.email}</span>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`block px-4 py-2 text-sm ${
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
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
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                          }`}
                        >
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          ) : (
            <Button
              onClick={() => signIn()}
              className="
                hidden md:inline-flex
                border border-gray-300
                rounded-md
                px-4 py-2
                hover:border-gray-400
                hover:bg-gray-50
                transition
              "
            >
              Sign In
            </Button>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(open => !open)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
            >
              {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown for signed-in users */}
      {mobileOpen && session && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-300 rounded-md transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 pb-3">
            <div className="px-4 flex items-center space-x-3">
              <Avatar src={profile.logoBase64} />
              <div>
                <p className="text-base font-medium text-gray-800">{session.user?.email}</p>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-300 rounded-md transition"
              >
                Profile
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-300 rounded-md transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sign-in for guests */}
      {mobileOpen && !session && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3">
          <Button
            onClick={() => signIn()}
            className="
              w-full
              border border-gray-300
              rounded-md
              px-4 py-2
              hover:border-gray-400
              hover:bg-gray-50
              transition
            "
          >
            Sign In
          </Button>
        </div>
      )}
    </nav>
  );
}
