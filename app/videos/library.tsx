'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Project = { id: string; title: string; draftVersion: number; lastStage: string };
type Edit = { mode: 'create' | 'rename' | 'delete'; project?: Project; key: string };

export function Library() {
  const [items, setItems] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<Edit | null>(null);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const sequence = useRef(0);

  const load = useCallback(async (after?: string) => {
    const current = ++sequence.current;
    setBusy(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '12', stage: filter });
      if (after) params.set('cursor',after);
      const response = await fetch('/api/projects?' + params);
      if (!response.ok) throw Error();
      const page = await response.json();
      if (current === sequence.current) {
        setItems(previous => after ? [...previous,...page.items.filter((p: Project) => !previous.some(item => item.id === p.id))] : page.items);
        setCursor(page.nextCursor);
      }
    } catch {
      if (current === sequence.current) setError('Could not load your videos.');
    } finally {
      if (current === sequence.current) setBusy(false);
    }
  },[filter]);

  useEffect(() => {
    setItems([]);
    setCursor(null);
    void load();
    return () => { sequence.current++; };
  },[load]);

  function open(mode: Edit['mode'], project?: Project) {
    setEdit({ mode, project, key: crypto.randomUUID() });
    setTitle(project?.title ?? '');
    setDialogError('');
    dialog.current?.showModal();
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!edit || saving) return;
    setSaving(true);
    try {
      const response = await fetch('/api/projects' + (edit.project ? '/' + edit.project.id : ''), {
        method: {create:'POST',rename:'PATCH',delete:'DELETE'}[edit.mode],
        headers: {'Content-Type':'application/json','Idempotency-Key':edit.key},
        body: JSON.stringify({title,expectedVersion:edit.project?.draftVersion})
      });
      if (!response.ok) {
        setDialogError(response.status === 409 ? 'Another tab changed this project. Close this dialog and retry with the latest version.' : 'Could not save this change. Try again.');
        if (response.status === 409 || response.status === 404) await load();
        return;
      }
      dialog.current?.close();
      await load();
    } catch { setDialogError('Could not reach the workspace. Try again.'); }
    finally { setSaving(false); }
  }

  return <><header className="section-head"><p>My workspace</p><h1>My videos</h1></header>
    <section className="block">
      <button className="action" onClick={() => open('create')}>Create project</button>
      <label> Stage <select value={filter} onChange={event=>setFilter(event.target.value)}>
        <option value="">All stages</option><option value="idea">Idea</option><option value="storyboard">Storyboard</option><option value="render">Render</option>
      </select></label>
      {items.map(project => <article className="block" key={project.id}><h2>{project.title}</h2><p>{project.lastStage}</p>
        <button onClick={()=>open('rename',project)}>Rename</button> <button onClick={()=>open('delete',project)}>Delete</button>
      </article>)}
      {busy && <p role="status">Loading projects…</p>}
      {error && <p role="alert">{error} <button onClick={()=>load(cursor ?? undefined)}>Retry</button></p>}
      {!busy && !error && !items.length && <p>{filter ? 'No projects at this stage.' : 'Your projects will appear here.'}</p>}
      {!error && cursor && <button disabled={busy} onClick={()=>load(cursor)}>Load more</button>}
    </section>
    <dialog ref={dialog} aria-labelledby="project-dialog-title" onCancel={event=>{if(saving)event.preventDefault();}}>
      <form onSubmit={save}><h2 id="project-dialog-title">{{create:'Create project',rename:'Rename project',delete:'Delete project'}[edit?.mode ?? 'create']}</h2>
        {edit?.mode === 'delete' ? <p>Delete “{edit.project?.title}” from your library?</p> :
          <label>Project title <input required maxLength={160} value={title} onChange={event=>setTitle(event.target.value)}/></label>}
        {dialogError && <p role="alert">{dialogError}</p>}
        <p><button type="button" disabled={saving} onClick={()=>dialog.current?.close()}>Cancel</button> <button disabled={saving}>{edit?.mode === 'delete' ? 'Delete project' : 'Save project'}</button></p>
      </form>
    </dialog></>;
}
