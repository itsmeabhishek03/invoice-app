'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className="p-8">Loading…</p>;
  }
  if (!session) {
    return (
      <div className="p-8">
        <p className="mb-4">You’re not signed in.</p>
        <Button onClick={() => signIn()}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      <p><strong>Email:</strong> {session.user?.email}</p>
      {/* <p><strong>Address:</strong> {session.user?.address ?? '—'}</p> */}
      <Button variant="secondary" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  );
}
