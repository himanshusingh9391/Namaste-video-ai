import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PasswordEntry } from './password-entry';
import { auth, configured, hasInvite } from '../lib/auth';
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
      admitted = Boolean(session && await hasInvite(session.user.email, session.user.emailVerified));
    } catch { /* Keep sign-in available during a transient database failure. */ }
    if (admitted) redirect(next);
  }
  const problem = query.reason === 'unavailable' ? 'The workspace database is unavailable. Try again in a moment.'
    : query.reason || query.error ? 'Sign-in was not completed. Check your pilot invitation and try again.' : '';
  return <main className="entry"><section className="entry-card">
    <div className="brand"><span className="brand-icon" aria-hidden="true">▶</span>Namaste Video</div>
    <p className="eyebrow">Private creator pilot</p><h1>Sign in to your workspace</h1>
    <p>Use the email address on your pilot invitation.</p>
    {problem && <p role="alert">{problem}</p>}
    <PasswordEntry next={next} ready={ready}/>
    {process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && <GoogleEntry next={next} ready={ready}/>}
    <p>First time using a password? Open your private setup link, or sign in with Google and add a password from Overview.</p>
    {!ready && <p role="status">Pilot sign-in is waiting for local configuration. The setup steps are in the project’s sign-in guide.</p>}
  </section></main>;
}
