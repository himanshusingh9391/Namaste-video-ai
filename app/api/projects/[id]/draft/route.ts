import { ObjectId } from 'mongodb';
import { fail, input, projects, withOwner } from '../../../../lib/projects';

export function PATCH(request: Request, context: { params: Promise<{id:string}> }) {
  return withOwner(request, async ownerId => {
    const {id} = await context.params;
    if (!ObjectId.isValid(id)) return fail(404,'Project unavailable');
    const body = await input(request);
    const draft = body.draft;
    if (Object.keys(body).some(key => !['draft','expectedVersion'].includes(key)) ||
        !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 1 ||
        !draft || typeof draft !== 'object' || Array.isArray(draft) ||
        Object.keys(draft).some(key => !['topic','notes','voiceId'].includes(key)) ||
        typeof draft.topic !== 'string' || draft.topic.length > 160 ||
        typeof draft.notes !== 'string' || draft.notes.length > 20000 ||
        typeof draft.voiceId !== 'string' || !draft.voiceId.trim() || draft.voiceId.length > 128) {
      return fail(422,'Invalid draft');
    }
    const filter = {_id:new ObjectId(id),ownerId,deletedAt:{$exists:false}};
    const savedAt = new Date();
    const result = await projects().updateOne({...filter,draftVersion:body.expectedVersion}, {
      $set:{'draft.topic':draft.topic,'draft.notes':draft.notes,'draft.voiceId':draft.voiceId,updatedAt:savedAt},
      $inc:{draftVersion:1}
    });
    if (!result.matchedCount) {
      const exists = await projects().findOne(filter,{projection:{_id:1}});
      return fail(exists ? 409 : 404,exists ? 'Draft changed. Review the saved version.' : 'Project unavailable');
    }
    return Response.json({draftVersion:body.expectedVersion+1,savedAt});
  });
}
