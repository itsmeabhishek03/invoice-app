import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const client = await clientPromise;
  const collection = client.db().collection('invoices');

  const now = new Date().toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoice: any = {
    ...data,
    userEmail: session.user.email,
    createdAt: now,
    updatedAt: now,
  };

  // If _id present, update; else insert new
  if (data._id) {
    const id = new ObjectId(data._id);
    await collection.updateOne({ _id: id, userEmail: session.user.email }, { $set: { ...data, updatedAt: now } });
    invoice._id = id;
  } else {
    const res = await collection.insertOne(invoice);
    invoice._id = res.insertedId;
  }

  return NextResponse.json(invoice);
}
