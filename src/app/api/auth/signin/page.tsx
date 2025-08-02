// app/auth/signin/page.tsx
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const error = params.get('error');

  useEffect(() => {
    if (session) router.replace('/');
  }, [session, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    await signIn('email', { email, callbackUrl: '/' });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 space-y-6">
        <h1 className="text-3xl font-extrabold text-gray-900 text-center">
          Sign in to InvoiceApp
        </h1>
        {error && (
          <p className="text-sm text-red-600 text-center">
            {error === 'OAuthSignin' ? 'Error signing in.' : error}
          </p>
        )}
        {submitted ? (
          <p className="text-center text-gray-700">
            Check your email <strong>{email}</strong> for the sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!email}>
              Send magic link
            </Button>
          </form>
        )}
        <p className="text-xs text-gray-500 text-center">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="underline">
            Privacy Policy
          </a>.
        </p>
      </div>
    </div>
  );
}
