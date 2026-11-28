import { ObjectId, type Filter, type Document } from 'mongodb';
import { createProject, fail, projects, withOwner } from '../../lib/projects';

export function POST(request: Request) {
  return withOwner(request, owner => createProject(request,owner));
}

export function GET(request: Request) {
  return withOwner(request, async ownerId => {
    const query = new URL(request.url).searchParams;
    const limit = Number(query.get('limit') ?? 20);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return fail(400,'Invalid limit');
    const filter: Filter<Document> = {ownerId, deletedAt:{$exists:false}};
    const cursor = query.get('cursor');
    if (cursor !== null) {
      try {
        const [time, id] = JSON.parse(Buffer.from(cursor,'base64url').toString());
        const updatedAt = new Date(time);
        if (typeof time !== 'string' || !Number.isFinite(updatedAt.getTime()) || !ObjectId.isValid(id)) throw Error();
        filter.$or = [{updatedAt:{$lt:updatedAt}}, {updatedAt,_id:{$lt:new ObjectId(id)}}];
      } catch { return fail(400,'Invalid cursor'); }
    }
    const rows = await projects().find(filter,{projection:{title:1,draftVersion:1,lastStage:1,updatedAt:1}})
      .sort({updatedAt:-1,_id:-1}).limit(limit+1).toArray();
    const items = rows.slice(0,limit).map(({_id,...rest})=>({id:_id.toHexString(),...rest}));
    const last = rows[limit-1];
    const nextCursor = rows.length>limit ? Buffer.from(JSON.stringify([last.updatedAt,last._id])).toString('base64url') : null;
    return Response.json({items,nextCursor});
  });
}
