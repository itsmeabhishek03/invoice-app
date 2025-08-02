// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from '@/lib/mongodb';

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {},
      from: 'no-reply@example.com',
      async sendVerificationRequest({ identifier, url }) {
        console.log(`\n👉 Sign in link for ${identifier}: ${url}\n`);
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
