import { createHash } from 'node:crypto';
import { ObjectId, MongoServerError } from 'mongodb';
import { auth, canAccess, databaseClient } from './auth';

export const fail = (status: number, error: string) => Response.json({ error }, { status });
export const projects = () => databaseClient().db().collection('projects');

export async function withOwner(request: Request, run: (ownerId: string) => Promise<Response>) {
  try {
    if (request.method !== 'GET' && request.headers.has('origin') &&
        request.headers.get('origin') !== new URL(process.env.BETTER_AUTH_URL!).origin) return fail(403,'Forbidden');
    const session = await auth().api.getSession({ headers: request.headers });
    if (!session || !await canAccess(session.user.email, session.user.emailVerified)) return fail(401,'Sign in required');
    return await run(session.user.id);
  } catch {
    return fail(503,'Workspace temporarily unavailable');
  }
}

export async function input(request: Request) {
  const body = await request.json().catch(() => null);
  return body && typeof body === 'object' && !Array.isArray(body) ? body : {};
}
export function titleOf(value: unknown) {
  return typeof value === 'string' && value.trim().length <= 160 ? value.trim() : '';
}

export async function createProject(request: Request, ownerId: string) {
  const body = await input(request);
  const title = titleOf(body.title);
  const notes = body.notes ?? '';
  const key = request.headers.get('Idempotency-Key');
  if (!title || typeof notes !== 'string' || notes.length > 20000 || !key || key.length > 200) return fail(400,'Provide a title, valid notes and an Idempotency-Key');
  const digest = (values: string[]) => createHash('sha256').update(JSON.stringify(values)).digest('hex');
  const _id = new ObjectId(digest([ownerId,key]).slice(0,24));
  const requestHash = digest([title,notes]);
  const now = new Date();
  try {
    await projects().insertOne({ _id, ownerId, requestHash, title, draft: {notes, scenes:[], voiceId:'daniel'}, draftVersion:1, lastStage:'idea', createdAt:now, updatedAt:now });
  } catch (error) {
    if (!(error instanceof MongoServerError) || error.code !== 11000) throw error;
    const previous = await projects().findOne({ _id, ownerId }, {projection:{requestHash:1}});
    if (previous?.requestHash !== requestHash) return fail(409,'Creation key already used');
  }
  return Response.json({id:_id.toHexString(),draftVersion:1,lastStage:'idea'},{status:201});
}
