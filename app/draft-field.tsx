'use client';

import { useEffect, useState } from 'react';

export function DraftField({ storageKey, label, example }: { storageKey: string; label: string; example: string }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Opening draft…');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { setText(localStorage.getItem(storageKey) ?? ''); setStatus('Stored on this browser'); }
    catch { setStatus('Browser storage unavailable'); }
    setReady(true);
  }, [storageKey]);
  function save(value: string) {
    setText(value);
    try { localStorage.setItem(storageKey, value); setStatus('Saved on this browser'); }
    catch { setStatus('Could not save. Copy your text before leaving.'); }
  }
  return <div className="field"><label htmlFor="draft">{label}</label><textarea id="draft" disabled={!ready} value={text} placeholder={example} onChange={e => save(e.target.value)}/><small role="status">{status}</small></div>;
}
