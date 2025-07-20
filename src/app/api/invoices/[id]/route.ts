import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await clientPromise;
  const invoice = await client
    .db()
    .collection('invoices')
    .findOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email,
    });

  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  // Convert _id to string for the client
  invoice._id = invoice._id.toString();
  return NextResponse.json(invoice);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await clientPromise;
  const res = await client
    .db()
    .collection('invoices')
    .deleteOne({
      _id: new ObjectId(params.id),
      userEmail: session.user.email,
    });

  if (res.deletedCount === 0) {
    return NextResponse.json({ error: 'Not found or not yours' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
