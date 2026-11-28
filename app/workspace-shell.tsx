'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useEffect, useRef, useState } from 'react';

import { authClient } from './auth-client';
export const OwnerContext = createContext('');
const destinations = [
  ['/dashboard', 'Overview', 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'],
  ['/videos', 'My videos', 'M3 5h18v14H3z M10 9l5 3-5 3z'],
  ['/projects/new', 'Create video', 'M12 5v14 M5 12h14'],
  ['/ideas', 'Idea notebook', 'M5 3h14v18H5z M8 8h8 M8 12h6'],
  ['/activity', 'Publishing activity', 'M3 12h4l3-7 4 14 3-7h4'],
  ['/settings/voice', 'Narration voice', 'M4 10v4 M8 6v12 M12 3v18 M16 7v10 M20 10v4'],
  ['/settings/instagram', 'Instagram connection', 'M8 3h8q5 0 5 5v8q0 5-5 5H8q-5 0-5-5V8q0-5 5-5z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 7h1'],
];

function Brand() {
  return <span className="brand"><span className="brand-icon" aria-hidden="true">▶</span>Namaste Video</span>;
}

export function WorkspaceShell({ children, ownerId, email }: { children: React.ReactNode; ownerId: string; email: string }) {
  const path = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => { dialog.current?.close(); }, [path]);
  useEffect(() => {
    const wide = matchMedia('(min-width: 1100px)');
    const closeWide = () => { if (wide.matches) dialog.current?.close(); };
    wide.addEventListener('change', closeWide);
    return () => wide.removeEventListener('change', closeWide);
  }, []);

  const [error, setError] = useState('');
  async function signOut() {
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      window.location.replace('/sign-in');
    } catch { setError('Sign-out failed. Please retry.'); }
  }
  const account = <div className="account"><small>{email}</small><button onClick={signOut}>Sign out</button>{error && <p role="alert">{error}</p>}</div>;
  function navigation() {
    return <nav aria-label="Workspace">{destinations.map(([href, label, icon]) =>
      <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} onClick={() => dialog.current?.close()}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon}/></svg>{label}
      </Link>)}</nav>;
  }
  return <OwnerContext.Provider value={ownerId}><a className="skip" href="#content">Skip to content</a>
    <aside className="rail"><Brand/>{navigation()}{account}</aside>
    <header className="mobile-bar"><Brand/><button ref={trigger} aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>☰ &nbsp; Menu</button></header>
    <dialog ref={dialog} aria-label="Workspace menu" onClose={() => trigger.current?.focus()} onClick={e => { if(e.target === dialog.current) dialog.current?.close(); }}>
      <div className="drawer"><div className="drawer-head"><Brand/><button onClick={() => dialog.current?.close()}>Close</button></div>{navigation()}{account}</div>
    </dialog>
    <main id="content" tabIndex={-1}>{children}</main></OwnerContext.Provider>;
}
