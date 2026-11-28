'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { authClient } from '../auth-client';

export function PasswordEntry({ next, ready }: { next: string; ready: boolean }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const setup = new URLSearchParams(window.location.hash.slice(1)).get('setup');
    if (setup) {
      setToken(setup);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get('password'));
    setBusy(true);
    setError('');
    try {
      if (token) {
        const result = await authClient.resetPassword({ token, newPassword: password });
        if (result.error) {
          setError('Password setup failed. Reopen your invitation or ask for a fresh setup link.');
          return;
        }
        form.reset();
        setToken('');
        setNotice('Password saved. Sign in with your invited email and new password.');
      } else {
        const email = String(data.get('email')).trim().toLowerCase();
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError('Sign-in failed. Check your email, password and pilot invitation.');
          return;
        }
        window.location.replace(next);
      }
    } catch {
      setError('Could not reach the workspace. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <form className="password-form" onSubmit={submit}>
    {notice && <p role="status">{notice}</p>}
    {!token && <label>Email<input name="email" type="email" autoComplete="username" required /></label>}
    <label>{token ? 'Choose a password (12–128 characters)' : 'Password'}
      <input name="password" type="password" autoComplete={token ? 'new-password' : 'current-password'}
        minLength={token ? 12 : undefined} maxLength={128} required /></label>
    {error && <p role="alert">{error}</p>}
    <button className="action" disabled={!ready || busy}>{busy ? 'Please wait…' : token ? 'Save password' : 'Sign in with email'}</button>
  </form>;
}
