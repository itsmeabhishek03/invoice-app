// // app/api/auth/[...nextauth]/route.ts
// import NextAuth from 'next-auth';
// import type { NextAuthOptions } from 'next-auth';
// import EmailProvider from 'next-auth/providers/email';
// import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
// import clientPromise from '@/lib/mongodb';

// export const authOptions: NextAuthOptions = {
//   adapter: MongoDBAdapter(clientPromise),

//   providers: [
//     EmailProvider({
//       server: {
//         host: process.env.EMAIL_SERVER_HOST!,
//         port: Number(process.env.EMAIL_SERVER_PORT!),
//         auth: {
//           user: process.env.EMAIL_SERVER_USER!,
//           pass: process.env.EMAIL_SERVER_PASSWORD!,
//         },
//       },
//       from: process.env.EMAIL_FROM!,
//     }),
//   ],

//   // secret must be defined (use `!` to assert it’s present)
//   secret: process.env.NEXTAUTH_SECRET!,

//   // we can omit the session.strategy since "jwt" is already the default
//   // session: { strategy: 'jwt' },

//   // you only need `pages` if you’re overriding NextAuth’s built‑in pages
//   // in our case we’re using the default, so we can leave it out
//   // pages: { signIn: '/api/auth/signin' },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };






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
      // we’re not using SMTP here
      server: {},
      from: 'no-reply@example.com',
      // override the default mail‑send to simply log the URL
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async sendVerificationRequest({ identifier, url, provider, theme }) {
        console.log(`\n👉 Sign in link for ${identifier}: ${url}\n`);
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
