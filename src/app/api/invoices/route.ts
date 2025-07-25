// List all invoices (GET) & create/update invoice (POST)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clientPromise;
  const invoices = await client
    .db()
    .collection('invoices')
    .find({ userEmail: session.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  const safe = invoices.map((inv) => {
    const { _id, ...rest } = inv;
    return { _id: _id.toString(), ...rest };
  });
  return NextResponse.json(safe);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const client = await clientPromise;
  const coll = client.db().collection('invoices');
  const now = new Date().toISOString();

  if (data._id) {
    // Update
    const id = new ObjectId(data._id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...toUpdate } = data;
    const result = await coll.findOneAndUpdate(
      { _id: id, userEmail: session.user.email },
      { $set: { ...toUpdate, updatedAt: now } },
      { returnDocument: 'after' }
    );
    if (!result.value)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const updated = result.value;
    return NextResponse.json({ ...updated, _id: updated._id.toString() });
  } else {
    // Insert
    const invoice = { ...data, userEmail: session.user.email, createdAt: now, updatedAt: now };
    const res = await coll.insertOne(invoice);
    return NextResponse.json({ _id: res.insertedId.toString(), ...invoice });
  }
}
