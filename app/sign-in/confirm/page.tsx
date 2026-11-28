'use client';

import { useEffect, useState } from 'react';

export default function ConfirmEmail() {
  const [token, setToken] = useState('');
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
  }, []);
  function confirm() {
    const query = new URLSearchParams({ token, callbackURL: '/sign-in/choose-password', errorCallbackURL: '/sign-in' });
    window.location.replace('/api/auth/magic-link/verify?' + query);
  }
  return <main className="entry"><section className="entry-card"><h1>Verify your email</h1>
    <button className="action" disabled={!token} onClick={confirm}>Continue to password setup</button>
    <p><a href="/sign-in">Request another setup link</a></p>
  </section></main>;
}
