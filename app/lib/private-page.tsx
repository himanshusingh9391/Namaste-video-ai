import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { WorkspaceShell } from '../workspace-shell';
import { auth, configured, hasInvite } from './auth';
import type { WorkspacePath } from './destinations';

export function privatePage(path: WorkspacePath, Content: React.ComponentType) {
  return async function ProtectedPage() {
    const entry = '/sign-in?next=' + encodeURIComponent(path);
    if (!configured()) redirect(entry);
    let session;
    let admitted = false;
    try {
      session = await auth().api.getSession({ headers: await headers() });
      if (session) admitted = await hasInvite(session.user.email, session.user.emailVerified);
    } catch {
      redirect(entry + '&reason=unavailable');
    }
    if (!session) redirect(entry);
    if (!admitted) redirect(entry + '&reason=invite');
    return <WorkspaceShell key={session.user.id} ownerId={session.user.id} email={session.user.email}><Content/></WorkspaceShell>;
  };
}
