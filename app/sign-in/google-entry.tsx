'use client';

import { useState } from 'react';
import { authClient } from '../auth-client';

export function GoogleEntry({next, ready}: {next: string; ready: boolean}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function enter() {
    setBusy(true); setError('');
    try {
      const result = await authClient.signIn.social({ provider: 'google', callbackURL: next,
        errorCallbackURL: '/sign-in?reason=signin&next=' + encodeURIComponent(next) });
      if (result.error) throw new Error();
    } catch {
      setError('Could not start Google sign-in. Please try again.'); setBusy(false);
    }
  }
  return <><button className="action" disabled={!ready || busy} onClick={enter}>{busy ? 'Opening Google…' : 'Continue with Google'}</button>{error && <p role="alert">{error}</p>}</>;
}
