'use client';

import { useActionState } from 'react';
import { addPassword } from './password-action';

export function PasswordSettings() {
  const [message, action, pending] = useActionState(addPassword, '');
  return <details className="block"><summary>Add an email sign-in password</summary>
    <form className="password-form" action={action}>
      <label>Choose a password (12–128 characters)
        <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <button className="action" disabled={pending}>{pending ? 'Saving…' : 'Add password'}</button>
      <p role="status">{message}</p>
    </form></details>;
}
