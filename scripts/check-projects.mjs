import assert from 'node:assert/strict';

export async function checkProjects(base, first, second) {
  const request = (method, path, cookie, body, key) => fetch(base + '/api/projects' + path, {
    method, headers: {cookie, origin:base, 'Content-Type':'application/json', ...(key && {'Idempotency-Key':key})},
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const create = (title,key) => request('POST','',first,{title},key);
  assert.equal((await request('GET','','')).status,401);
  assert.equal((await create(' ','bad')).status,400);
  const created = await create('First','one');
  assert.equal(created.status,201);
  const {id} = await created.json();
  assert.equal((await (await create('First','one')).json()).id,id);
  assert.equal((await create('Changed','one')).status,409);
  await create('Second','two');
  const page = await (await request('GET','?limit=1',first)).json();
  assert.equal(page.items.length,1);
  const next = await (await request('GET','?limit=1&cursor='+page.nextCursor,first)).json();
  assert.equal(next.items[0].id,id);
  assert.equal(next.nextCursor,null);
  assert.deepEqual((await (await request('GET','',second)).json()).items,[]);
  const path = '/'+id;
  for (const method of ['GET','PATCH','DELETE']) {
    assert.equal((await request(method,path,second,method==='GET'?undefined:{title:'Other',expectedVersion:1})).status,404);
  }
  assert.equal((await request('PATCH',path,first,{title:'Renamed',expectedVersion:1})).status,200);
  assert.equal((await request('DELETE',path,first,{expectedVersion:1})).status,409);
  assert.equal((await request('DELETE',path,first,{expectedVersion:2})).status,204);
  assert.equal((await request('GET',path,first)).status,404);
  assert.equal((await (await request('GET','',first)).json()).items.length,1);
}
