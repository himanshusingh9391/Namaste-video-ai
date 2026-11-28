import { ObjectId } from 'mongodb';
import { withOwner, projects, fail, input, titleOf } from '../../../lib/projects';

type Context = { params: Promise<{id:string}> };
async function handle(request: Request, context: Context) {
  return withOwner(request, async ownerId => {
    const {id} = await context.params;
    if (!ObjectId.isValid(id)) return fail(404,'Project unavailable');
    const filter = {_id:new ObjectId(id),ownerId,deletedAt:{$exists:false}};
    if (request.method === 'GET') {
      const project = await projects().findOne(filter,{projection:{ownerId:0,requestHash:0,_id:0}});
      return project ? Response.json({id,...project}) : fail(404,'Project unavailable');
    }
    const body = await input(request);
    if (!Number.isSafeInteger(body.expectedVersion) || body.expectedVersion<1) return fail(400,'Invalid expected version');
    const deleting = request.method === 'DELETE';
    const title = titleOf(body.title);
    if (!deleting && !title) return fail(400,'Invalid title');
    const updatedAt = new Date();
    const fields = deleting ? {deletedAt:updatedAt, updatedAt} : {title,updatedAt};
    const result = await projects().updateOne({...filter,draftVersion:body.expectedVersion},{$set:fields,$inc:{draftVersion:1}});
    if (!result.matchedCount) {
      const exists = await projects().findOne(filter,{projection:{_id:1}});
      return exists ? fail(409,'Project changed. Reload before retrying.') : fail(404,'Project unavailable');
    }
    return deleting ? new Response(null,{status:204}) : Response.json({id,title,draftVersion:body.expectedVersion+1,updatedAt});
  });
}
export { handle as GET, handle as PATCH, handle as DELETE };
