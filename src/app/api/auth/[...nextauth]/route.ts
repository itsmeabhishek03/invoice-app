// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { Resend } from 'resend';
import clientPromise from '@/lib/mongodb';

const resend = new Resend(process.env.RESEND_API_KEY!);

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    EmailProvider({
      server: {},            // not used
      from: 'no-reply@yourdomain.com',
      async sendVerificationRequest({ identifier, url, provider }) {
        console.log('[NextAuth] Preparing to send magic link:');
        console.log('  to:', identifier);
        console.log('  url:', url);
        console.log('  from:', provider.from);
        const html = `
          <div style="font-family: sans-serif; line-height: 1.5; color: #333;">
            <h2>Passwordless Sign-In</h2>
            <p>Click below to sign in as <strong>${identifier}</strong>:</p>
            <a href="${url}" style="
                display: inline-block;
                padding: 12px 24px;
                margin: 16px 0;
                background-color: #2563eb;
                color: #fff;
                text-decoration: none;
                border-radius: 4px;
              ">Sign In</a>
            <p style="font-size: 0.9em; color: #666;">
              If you didn’t request this, ignore this email.
            </p>
          </div>
        `;
        try {
          const resp = await resend.emails.send({
            from: provider.from,
            to: [identifier],
            subject: 'Your sign-in link for InvoiceApp',
            html,
          });
          console.log('[NextAuth] Resend response:', resp);
        } catch (err) {
          console.error('[NextAuth] Resend error:', err);
          // Re-throw so NextAuth knows it failed
          throw new Error('Error sending verification email');
        }
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
