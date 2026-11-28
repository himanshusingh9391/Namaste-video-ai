import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !process.env.MONGODB_URI || !process.env.BETTER_AUTH_URL || !(process.env.BETTER_AUTH_SECRET?.length >= 32)) {
  console.error('Configure the pilot environment and supply the invited email.');
  process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  const db = client.db();
  if (!await db.collection('pilotInvites').findOne({ normalizedEmail: email, status: 'active' })) {
    throw new Error('Active invitation required.');
  }
  const pilot = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
      enabled: true,
      resetPasswordTokenExpiresIn: 900,
      async sendResetPassword({ token }) {
        const link = new URL('/sign-in?setup=1', process.env.BETTER_AUTH_URL);
        link.hash = new URLSearchParams({ setup: token }).toString();
        console.log(link.href);
      }
    }
  });
  const { internalAdapter } = await pilot.$context;
  if (!await internalAdapter.findUserByEmail(email)) {
    await internalAdapter.createUser({ email, name: email.split('@')[0], emailVerified: true });
  }
  await pilot.api.requestPasswordReset({ body: { email } });
} catch {
  console.error('Could not issue a setup link. Check the active invitation and database connectivity.');
  process.exitCode = 1;
} finally {
  await client.close();
}
