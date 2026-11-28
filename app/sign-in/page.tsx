import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Registration } from './registration';
import { emailConfigured } from '../lib/setup-email';
import { PasswordEntry } from './password-entry';
import { auth, configured, canAccess } from '../lib/auth';
import { returnPath } from '../lib/destinations';
import { GoogleEntry } from './google-entry';

export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const ready = configured();
  const next = returnPath(query.next);
  if (ready && !query.setup) {
    let admitted = false;
    try {
      const session = await auth().api.getSession({ headers: await headers() });
      admitted = Boolean(session && await canAccess(session.user.email, session.user.emailVerified));
    } catch { /* Keep sign-in available during a transient database failure. */ }
    if (admitted) redirect(next);
  }
  const problem = query.reason === 'unavailable' ? 'The workspace database is unavailable. Try again in a moment.'
    : query.reason || query.error ? 'Sign-in was not completed. Please try again.' : '';
  return <main className="entry"><section className="entry-card">
    <div className="brand"><span className="brand-icon" aria-hidden="true">▶</span>Namaste Video</div>
    <p className="eyebrow">Creator workspace</p><h1>Sign in to your workspace</h1>
    <p>Use the email address associated with your workspace.</p>
    {problem && <p role="alert">{problem}</p>}
    <PasswordEntry next={next} ready={ready}/>
    {process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && <GoogleEntry next={next} ready={ready}/>}
    <Registration ready={ready && emailConfigured()}/>
    {!ready && <p role="status">Pilot sign-in is waiting for local configuration. The setup steps are in the project’s sign-in guide.</p>}
  </section></main>;
}
