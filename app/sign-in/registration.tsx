'use client';

import { useState, type FormEvent } from 'react';
import { authClient } from '../auth-client';

export function Registration({ ready }: { ready: boolean }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get('email')).trim().toLowerCase();
    setBusy(true);
    setMessage('');
    try {
      const result = await authClient.signIn.magicLink({ email });
      setMessage(result.error ? 'Could not send the email. Try again later.' : 'If this email is approved, check your inbox for a setup link. It expires in 15 minutes.');
    } catch {
      setMessage('Could not reach the email service. Try again later.');
    } finally { setBusy(false); }
  }
  return <details><summary>Request an approved account setup link</summary>
    <form className="password-form" onSubmit={submit}>
      <label>Your email<input name="email" type="email" autoComplete="email" required /></label>
      <button className="action" disabled={!ready || busy}>{busy ? 'Sending…' : 'Email me a setup link'}</button>
      {!ready && <p>Email setup is waiting for the site administrator to configure delivery.</p>}
      <p role="status">{message}</p>
    </form></details>;
}
