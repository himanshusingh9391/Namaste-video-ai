import { MongoClient } from 'mongodb';

const [action, rawEmail] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
if (!['grant', 'revoke'].includes(action) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !process.env.MONGODB_URI) {
  console.error('Set MONGODB_URI, then use npm run invite -- grant|revoke email@example.com');
  process.exit(1);
}
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  const invites = client.db().collection('pilotInvites');
  await invites.createIndex({ normalizedEmail: 1 }, { unique: true });
  await invites.updateOne({ normalizedEmail: email }, {
    $set: { status: action === 'grant' ? 'active' : 'revoked', updatedAt: new Date() },
    $setOnInsert: { createdAt: new Date() }
  }, { upsert: true });
  console.log(action === 'grant' ? 'Invitation active.' : 'Invitation revoked.');
} catch {
  console.error('Invitation update failed. Check MongoDB connectivity and permissions.');
  process.exitCode = 1;
} finally { await client.close(); }
