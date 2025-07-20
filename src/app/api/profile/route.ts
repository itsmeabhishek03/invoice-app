// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db();
  const profile = await db
    .collection('profiles')
    .findOne({ email: session.user.email });
  return NextResponse.json(profile || {});
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  const { companyName, address, currency, logoBase64 } = data;
  const client = await clientPromise;
  const db = client.db();
  await db.collection('profiles').updateOne(
    { email: session.user.email },
    {
      $set: {
        email: session.user.email,
        companyName,
        address,
        currency,
        logoBase64: logoBase64 || null,
      },
    },
    { upsert: true }
  );
  return NextResponse.json({ success: true });
}
