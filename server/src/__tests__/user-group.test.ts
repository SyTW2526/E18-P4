import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { userGroupRouter } from '../routes/user-group.route';

let mongod: MongoMemoryServer | null = null;
let app: express.Express;

beforeAll(async () => {
  // Allow tests to use an external Mongo instance by setting MONGO_TEST_URI.
  // This avoids the need for mongodb-memory-server to download a mongod binary
  // in environments where that is problematic (missing libs).
  const externalUri = process.env.MONGO_TEST_URI;
  let uri: string;
  if (externalUri) {
    uri = externalUri;
  } else {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
  }

  await connectToDatabase(uri);
  app = express();
  app.use(express.json());
  app.use('/user-group', userGroupRouter);
});

afterAll(async () => {
  // close DB client so Jest can exit cleanly
  try {
    await closeDatabase();
  } catch (err) {}
  if (mongod) {
    try {
      await mongod.stop();
    } catch (e) {}
  }
});

describe('user-group routes', () => {
  test('POST /user-group/shared-accounts creates group and auto-joins creator', async () => {
    const payload = { nombre: 'TestGroup', fecha_creacion: new Date().toISOString(), moneda: 'EUR', creador_id: 'user1' };
    const res = await request(app).post('/user-group/shared-accounts').send(payload).expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('creatorMembershipId');

    // check user_groups collection has the membership
    const rows = await collections.userGroups!.find({ id_usuario: 'user1' }).toArray();
    expect(rows.length).toBeGreaterThan(0);
  });

  test('GET /user-group/user-groups/user/:id returns groups for user', async () => {
    // create a group manually and a user_groups relation
    const sharedRes = await collections.sharedAccounts!.insertOne({ nombre: 'G2', moneda: 'EUR', creador_id: 'u2', fecha_creacion: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: 'u2', id_grupo: String(sharedRes.insertedId), rol: 'admin', fecha_union: new Date() });

    const res = await request(app).get('/user-group/user-groups/user/u2').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('nombre');
  });
});
