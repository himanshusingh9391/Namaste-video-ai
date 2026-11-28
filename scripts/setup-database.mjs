import { MongoClient } from 'mongodb';

const nonempty = { bsonType: 'string', minLength: 1 };
const date = { bsonType: 'date' };
const collections = [
  {
    name: 'pilotInvites',
    fields: { normalizedEmail: nonempty, status: { enum: ['active', 'revoked'] }, createdAt: date },
    index: { normalizedEmail: 1 }, unique: true
  },
  {
    name: 'preferences',
    fields: { ownerId: nonempty },
    index: { ownerId: 1 }, unique: true
  },
  {
    name: 'projects',
    fields: {
      ownerId: nonempty, title: nonempty, draft: { bsonType: 'object' },
      draftVersion: { bsonType: ['int', 'long'], minimum: 0 }, lastStage: nonempty,
      createdAt: date, updatedAt: date
    },
    index: { ownerId: 1, updatedAt: -1, _id: -1 }
  }
];

if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI before running database setup.');
const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
try {
  const db = client.db();
  for (const { name, fields, index, unique } of collections) {
    const validator = { $jsonSchema: { bsonType: 'object', required: Object.keys(fields), properties: fields } };
    try {
      await db.createCollection(name, { validator });
    } catch (error) {
      if (error.code !== 48) throw error;
    }
    // createCollection can also succeed when the collection already exists.
    await db.command({ collMod: name, validator, validationLevel: 'strict', validationAction: 'error' });
    await db.collection(name).createIndex(index, unique ? { unique: true } : {});
  }
  console.log('Workspace collection validators and indexes are ready.');
} catch (error) {
  console.error('Database setup failed. Check connectivity, schema permissions and existing indexes.', error.code ?? error.name);
  process.exitCode = 1;
} finally {
  await client.close();
}
