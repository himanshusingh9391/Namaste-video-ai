import { configured } from '../lib/auth';
import { returnPath } from '../lib/destinations';
import { GoogleEntry } from './google-entry';

export default async function SignIn({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const ready = configured();
  const problem = query.reason === 'unavailable' ? 'The workspace database is unavailable. Try again in a moment.'
    : query.reason || query.error ? 'Sign-in was not completed. Choose the invited, verified Google account or ask the pilot administrator to check your invitation.' : '';
  return <main className="entry"><section className="entry-card">
    <div className="brand"><span className="brand-icon" aria-hidden="true">▶</span>Namaste Video</div>
    <p className="eyebrow">Private creator pilot</p><h1>Sign in to your workspace</h1>
    <p>Use the Google account your pilot invitation was issued to.</p>
    {problem && <p role="alert">{problem}</p>}
    <GoogleEntry next={returnPath(query.next)} ready={ready}/>
    {!ready && <p role="status">Pilot sign-in is waiting for local configuration. The setup steps are in the project’s sign-in guide.</p>}
  </section></main>;
}
