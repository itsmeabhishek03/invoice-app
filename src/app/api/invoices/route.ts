// src/app/api/invoices/route.ts
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

  return NextResponse.json(
    invoices.map(inv => ({
      _id: inv._id.toString(),
      clientName: inv.clientName,
      clientEmail: inv.clientEmail,
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      notes: inv.notes,
      items: inv.items,
      subtotal: inv.subtotal,
      totalTax: inv.totalTax,
      total: inv.total,
      companyName: inv.companyName,
      logoBase64: inv.logoBase64,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt
    }))
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();
  const client = await clientPromise;
  const coll = client.db().collection('invoices');
  const now = new Date().toISOString();

  const compute = (items: any[]) => {
    const subtotal = items.reduce((sum, it) => sum + it.quantity * it.rate, 0);
    const totalTax = items.reduce((sum, it) => sum + (it.quantity * it.rate * it.tax) / 100, 0);
    return { subtotal, totalTax, total: subtotal + totalTax };
  };

  if (data._id) {
    const id = new ObjectId(data._id);
    const { _id, ...rest } = data;
    const { subtotal, totalTax, total } = compute(rest.items);
    const result = await coll.findOneAndUpdate(
      { _id: id, userEmail: session.user.email },
      {
        $set: {
          ...rest,
          subtotal,
          totalTax,
          total,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );
    if (!result.value)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const u = result.value;
    return NextResponse.json({ 
      _id: u._id.toString(),
      ...rest,
      subtotal,
      totalTax,
      total,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    });
  } else {
    const { subtotal, totalTax, total } = compute(data.items);
    const invoice = {
      ...data,
      userEmail: session.user.email,
      subtotal,
      totalTax,
      total,
      createdAt: now,
      updatedAt: now
    };
    const res = await coll.insertOne(invoice);
    return NextResponse.json({
      _id: res.insertedId.toString(),
      ...invoice
    });
  }
}
