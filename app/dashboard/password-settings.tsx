'use client';

import { useActionState } from 'react';
import { addPassword } from './password-action';

export function PasswordSettings({ setup = false, owner }: { setup?: boolean; owner?: string }) {
  const [message, action, pending] = useActionState(addPassword, '');
  const form = (
    <form className="password-form" action={action}>
      {owner && <input type="hidden" name="owner" value={owner}/>}
      <label>Choose a password (12–128 characters)
        <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
      </label>
      <button className="action" disabled={pending}>{pending ? 'Saving…' : 'Add password'}</button>
      <p role="status">{message}</p>
    </form>);
  return setup ? form : <details className="block"><summary>Add an email sign-in password</summary>{form}</details>;
}
