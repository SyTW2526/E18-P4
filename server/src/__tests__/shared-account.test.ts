import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { sharedAccountsRouter } from '../routes/shared-account.route';

let mongod: MongoMemoryServer | null = null;
let app: express.Express;

beforeAll(async () => {
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
  app.use('/shared-account', sharedAccountsRouter);
});

afterAll(async () => {
  try { await closeDatabase(); } catch (e) {}
  if (mongod) {
    try { await mongod.stop(); } catch (e) {}
  }
});

describe('shared account routes', () => {
  test('POST /shared-account creates and GET endpoints work', async () => {
    const payload = { nombre: 'Group A', moneda: 'eur', creador_id: 'u1' };
    const postRes = await request(app).post('/shared-account').send(payload).expect(201);
    expect(postRes.body).toHaveProperty('id');

    const id = postRes.body.id;
    const getRes = await request(app).get(`/shared-account/${id}`).expect(200);
    expect(getRes.body).toHaveProperty('nombre', 'Group A');

    const listRes = await request(app).get('/shared-account').expect(200);
    expect(Array.isArray(listRes.body)).toBeTruthy();
  });
});
