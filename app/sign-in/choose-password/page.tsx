import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, configured, canAccess } from '../../lib/auth';
import { PasswordSettings } from '../../dashboard/password-settings';

export default async function ChoosePassword() {
  if (!configured()) redirect('/sign-in');
  const requestHeaders = await headers();
  const session = await auth().api.getSession({ headers: requestHeaders });
  if (!session || !await canAccess(session.user.email, session.user.emailVerified)) redirect('/sign-in');
  const accounts = await auth().api.listUserAccounts({ headers: requestHeaders });
  if (accounts.some(account => account.providerId === 'credential')) redirect('/dashboard');
  return <main className="entry"><section className="entry-card"><h1>Choose your password</h1>
    <p>Email verified for {session.user.email}.</p>
    <PasswordSettings setup owner={session.user.id}/>
  </section></main>;
}
