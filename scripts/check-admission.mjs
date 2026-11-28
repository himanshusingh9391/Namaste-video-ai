import { checkProjects } from './check-projects.mjs';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
const id = randomUUID().replaceAll('-', '').slice(0,24);
const dbName = 'namaste_qa_' + id;
const uri = new URL(process.env.TEST_MONGODB_URI ?? 'mongodb://127.0.0.1:27017/?replicaSet=rs0');
uri.pathname = '/' + dbName;
const base = 'http://127.0.0.1:3107';
const env = { ...process.env, MONGODB_URI: uri.href, BETTER_AUTH_URL: base, BETTER_AUTH_SECRET: randomUUID() };
const client = new MongoClient(uri.href, { serverSelectionTimeoutMS: 6500 });
const db = client.db(dbName);
let server, created = false;
try {
  await db.command({ping:1});
  const email = 'qa@example.invalid';
  await db.collection('pilotInvites').insertOne({ normalizedEmail:email, status:'active', createdAt:new Date() });
  created = true;
  const output = execFileSync(process.execPath, ['scripts/password-link.mjs', email], { env, encoding:'utf8' });
  const token = new URLSearchParams(new URL(output.trim().split(/\r?\n/).at(-1)).hash.slice(1)).get('setup');
  assert.ok(token);
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','3107'], { env, stdio:'ignore' });
  for (let i=0; i<50; i++) {
    if (await fetch(base+'/sign-in').then(r=>r.ok).catch(()=>false)) break;
    await new Promise(r=>setTimeout(r,350));
  }
  const post = (path, data, cookie='') => fetch(base+'/api/auth/'+path,{method:'POST', headers:{'Content-Type':'application/json',origin:base,cookie},body:JSON.stringify(data)});
  const password = randomUUID();
  assert.equal((await post('reset-password',{token,newPassword:password})).status,200,'set password');
  assert.equal((await post('sign-in/email',{email,password})).status,200,'first sign-in');
  assert.ok((await post('reset-password',{token,newPassword:password})).status>=400,'single-use link');
  assert.ok((await post('sign-in/email',{email,password:randomUUID()})).status>=400,'incorrect password');
  const login=await post('sign-in/email',{email,password});
  assert.equal(login.status,200);
  const cookie=login.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
  if(process.argv.includes('--projects')) {
    // Let the previous password-setup attempts leave the authentication throttle window.
    await new Promise(resolve => setTimeout(resolve, 61000));
    const secondEmail='other@example.invalid';
    await db.collection('pilotInvites').insertOne({normalizedEmail:secondEmail,status:'active',createdAt:new Date()});
    const link=execFileSync(process.execPath,['scripts/password-link.mjs',secondEmail],{env,encoding:'utf8'}).trim().split(/\r?\n/).at(-1);
    const secondToken=new URLSearchParams(new URL(link).hash.slice(1)).get('setup');
    assert.equal((await post('reset-password',{token:secondToken,newPassword:password})).status,200);
    const second=await post('sign-in/email',{email:secondEmail,password});
    assert.equal(second.status,200);
    await checkProjects(base,cookie,second.headers.getSetCookie().map(v=>v.split(';')[0]).join('; '));
    console.log('Verified project ownership, validation, pagination, revision conflicts, deletion and creation replay.');
  }
  const get=path=>fetch(base+path,{headers:{cookie},redirect:'manual'});
  assert.equal((await get('/dashboard')).status,200);
  const entry = await get('/sign-in');
  assert.equal(new URL(entry.headers.get('location'),base).pathname,'/dashboard');
  for (const path of ['/dashboard','/ideas','/projects/new','/activity','/settings/voice','/settings/instagram']) {
    const anonymous = await fetch(base+path,{redirect:'manual'});
    assert.match(anonymous.headers.get('location'),/sign-in/);
  }
  assert.equal((await fetch(base+'/out/water-cycle-daniel-animated.mp4')).status,404);
  await db.collection('pilotInvites').updateOne({normalizedEmail:email},{$set:{status:'revoked'}});
  assert.match((await get('/dashboard')).headers.get('location'),/sign-in/);
  assert.ok((await post('sign-in/email',{email,password})).status>=400);
  await db.collection('pilotInvites').deleteOne({normalizedEmail:email});
  assert.ok((await post('sign-in/email',{email,password})).status>=400);
  await db.collection('pilotInvites').insertOne({normalizedEmail:email,status:'active',createdAt:new Date()});
  const record = await db.collection('session').findOne({token:(await login.clone().json()).token});
  assert.ok(record);
  await db.collection('session').updateOne({_id:record._id},{$set:{expiresAt:new Date(0)}});
  assert.match((await get('/dashboard')).headers.get('location'),/sign-in/);
  await db.collection('session').updateOne({_id:record._id},{$set:{expiresAt:record.expiresAt}});
  assert.equal((await post('sign-out',{},cookie)).status,200);
  assert.match((await get('/dashboard')).headers.get('location'),/sign-in/);
  assert.equal((await post('sign-up/email',{email:'unknown@example.invalid',password,name:'Unknown'})).status,404);
  console.log('Verified approved-only login, revocation, private routes, private source media, setup and sign-out.');
} catch(error) {
  console.error(error.name, String(error.message).replace(/mongodb(\+srv)?:\/\/[^ ]+/g,'[redacted]')); process.exitCode=1;
} finally {
  server?.kill();
  if(created && db.databaseName === 'namaste_qa_' + id) await db.dropDatabase();
  await client.close();
}
