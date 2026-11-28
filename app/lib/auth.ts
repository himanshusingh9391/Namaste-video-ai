import 'server-only';
import { nextCookies } from 'better-auth/next-js';
import { magicLink } from 'better-auth/plugins/magic-link';
import { sendSetupEmail } from './setup-email';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { MongoClient } from 'mongodb';

export function configured() {
  return Boolean(process.env.MONGODB_URI && process.env.BETTER_AUTH_URL &&
    (process.env.BETTER_AUTH_SECRET?.length ?? 0) >= 32);
}

let client: MongoClient | undefined;
function databaseClient() {
  if (!process.env.MONGODB_URI) throw new Error('MongoDB is not configured');
  return client ??= new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
}

export async function canAccess(email: string, verified: boolean) {
  if (!verified || !email) return false;
  const invite = await databaseClient().db().collection('pilotInvites').findOne(
    { normalizedEmail: email.trim().toLowerCase(), status: 'revoked' }, { projection: { _id: 1 } }
  );
  return !invite;
}

function createAuth() {
  if (!configured()) throw new Error('Pilot authentication is not configured');
  const client = databaseClient();
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL!,
    secret: process.env.BETTER_AUTH_SECRET!,
    database: mongodbAdapter(client.db(), { client }),
    emailAndPassword: { enabled: true, disableSignUp: true, requireEmailVerification: true, minPasswordLength: 12, revokeSessionsOnPasswordReset: true },
    rateLimit: { enabled: true },
    plugins: [magicLink({ expiresIn: 900, storeToken: 'hashed', sendMagicLink: sendSetupEmail }), nextCookies()],
    socialProviders: { google: {
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: 'select_account',
      async mapProfileToUser(profile) {
        if (!(await canAccess(profile.email, profile.email_verified === true))) {
          throw new APIError('FORBIDDEN', { message: 'This account cannot sign in.' });
        }
        return { email: profile.email.trim().toLowerCase() };
      }
    } },
    databaseHooks: {
      session: { create: { async before(session, ctx) {
        const user = await ctx?.context.internalAdapter.findUserById(session.userId);
        if (!user || !(await canAccess(user.email, user.emailVerified))) {
          throw new APIError('FORBIDDEN', { message: 'Account access denied.' });
        }
      } } },
      user: { create: { async before(user) {
        if (!(await canAccess(user.email, user.emailVerified))) {
          throw new APIError('FORBIDDEN', { message: 'Account access denied.' });
        }
      } } }
    },
    account: { accountLinking: { enabled: true, trustedProviders: ['google'] } },
    onAPIError: { errorURL: '/sign-in?reason=signin' }
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function auth() { return instance ??= createAuth(); }
