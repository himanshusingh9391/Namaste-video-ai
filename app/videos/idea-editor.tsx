'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Draft = {topic:string;notes:string;voiceId:string};
type Snapshot = {draft:Draft;draftVersion:number};
export function IdeaEditor({id}: {id:string}) {
  const [opened,setOpened] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(()=>{if(details.current?.open)setOpened(true);},[]);
  return <details ref={details} onToggle={event=>{if(event.currentTarget.open)setOpened(true);}}>
    <summary>Edit idea</summary>{opened && <DraftEditor id={id}/>}
  </details>;
}
function DraftEditor({id}: {id:string}) {
  const fieldId = useId();
  const [snapshot,setSnapshot] = useState<Snapshot|null>(null);
  const [draft,setDraft] = useState<Draft|null>(null);
  const [message,setMessage] = useState('Loading draft…');
  const [blocked,setBlocked] = useState(false);
  const [retry,setRetry] = useState(0);
  const saving = useRef(false);
  async function load() {
    try {
      const response=await fetch('/api/projects/'+id);
      if(!response.ok) throw Error();
      const project=await response.json();
      const loaded={topic:project.draft.topic ?? project.title,notes:project.draft.notes ?? '',voiceId:project.draft.voiceId ?? 'daniel'};
      setSnapshot({draft:loaded,draftVersion:project.draftVersion});
      setDraft(loaded);setBlocked(false);setMessage('Saved');
    } catch {setMessage('Could not load this project.');}
  }
  useEffect(()=>{void load();},[id]);
  const dirty=Boolean(draft && snapshot && JSON.stringify(draft)!==JSON.stringify(snapshot.draft));
  useEffect(()=>{
    if(!dirty || blocked || !draft || !snapshot) return;
    const timer=setTimeout(async()=>{
      if(saving.current) return;
      saving.current=true;setMessage('Saving…');
      try {
        const response=await fetch('/api/projects/'+id+'/draft',{
          method:'PATCH',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({expectedVersion:snapshot.draftVersion,draft})
        });
        if(!response.ok) {
          setBlocked(true);
          setMessage(response.status===409 ? 'Another tab changed this project. Your input is kept here. Copy it before loading the saved version.' : 'Save failed. Your input is kept here. Retry when connected.');
          return;
        }
        const result=await response.json();
        setSnapshot({draft,draftVersion:result.draftVersion});setMessage('Saved');
      } catch {setBlocked(true);setMessage('Save failed. Your input is kept here. Retry when connected.');}
      finally {saving.current=false;}
    },700);
    return ()=>clearTimeout(timer);
  },[draft,snapshot,dirty,blocked,retry,id]);
  useEffect(()=>{
    const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);
  if(!draft) return <p role="status">{message} <button onClick={load}>Retry</button></p>;
  return <section className="block"><h2>Idea draft</h2>
    <label htmlFor={fieldId+"-topic"}>Topic</label><input id={fieldId+"-topic"} maxLength={160} value={draft.topic} onChange={e=>setDraft({...draft,topic:e.target.value})}/>
    <label htmlFor={fieldId+"-notes"}>Notes</label><textarea id={fieldId+"-notes"} maxLength={20000} value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})}/>
    <label htmlFor={fieldId+"-voice"}>Voice</label><input id={fieldId+"-voice"} maxLength={128} value={draft.voiceId} onChange={e=>setDraft({...draft,voiceId:e.target.value})}/>
    <p role="status">{message}</p>
    {blocked && <><button onClick={()=>{setBlocked(false);setRetry(v=>v+1);}}>Retry save</button>
      <button onClick={()=>{if(window.confirm('Replace your current input with the saved version?')) void load();}}>Load saved version</button></>}
  </section>;
}
