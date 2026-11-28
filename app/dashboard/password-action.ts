'use server';

import { headers } from 'next/headers';
import { auth, hasInvite } from '../lib/auth';

export async function addPassword(_previous: string, data: FormData) {
  const password = data.get('password');
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return 'Choose a password between 12 and 128 characters.';
  }
  try {
    const requestHeaders = await headers();
    const session = await auth().api.getSession({ headers: requestHeaders });
    if (!session || !await hasInvite(session.user.email, session.user.emailVerified)) {
      return 'Sign in again with your invited account.';
    }
    await auth().api.setPassword({ headers: requestHeaders, body: { newPassword: password } });
    return 'Password saved. You can now sign in with your email.';
  } catch {
    return 'Could not add a password. Sign in again and retry. If you already have a password, ask the pilot administrator for a reset link.';
  }
}
