// src/app/api/invoices/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await req.json();
  const client = await clientPromise;
  const collection = client.db().collection('invoices');

  const now = new Date().toISOString();

  if (data._id) {
    // Updating existing invoice
    const id = new ObjectId(data._id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...toUpdate } = data;  // strip out _id
    const updateResult = await collection.findOneAndUpdate(
      { _id: id, userEmail: session.user.email },
      {
        $set: {
          ...toUpdate,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updateResult.value) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Build a JSON‑safe response
    const updatedInvoice = {
      ...updateResult.value,
      _id: updateResult.value._id.toString(),
    };

    return NextResponse.json(updatedInvoice);
  } else {
    // Inserting new invoice
    const invoice = {
      ...data,
      userEmail: session.user.email,
      createdAt: now,
      updatedAt: now,
    };
    const insertResult = await collection.insertOne(invoice);

    const newInvoice = {
      ...invoice,
      _id: insertResult.insertedId.toString(),
    };

    return NextResponse.json(newInvoice);
  }
}
