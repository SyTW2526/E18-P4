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

  test('POST /shared-account normalizes moneda to uppercase', async () => {
    const payload = { nombre: 'Currency Test', moneda: 'usd', creador_id: 'u2' };
    const postRes = await request(app).post('/shared-account').send(payload).expect(201);
    const id = postRes.body.id;

    const getRes = await request(app).get(`/shared-account/${id}`).expect(200);
    expect(getRes.body).toHaveProperty('moneda', 'USD');
  });

  test('POST /shared-account sets fecha_creacion automatically if not provided', async () => {
    const payload = { nombre: 'Auto Date', moneda: 'EUR', creador_id: 'u3' };
    const postRes = await request(app).post('/shared-account').send(payload).expect(201);
    const id = postRes.body.id;

    const ObjectId = require('mongodb').ObjectId;
    const fetched = await collections.sharedAccounts!.findOne({ _id: new ObjectId(id) });
    expect(fetched).toHaveProperty('fecha_creacion');
    expect((fetched as any).fecha_creacion).toBeInstanceOf(Date);
  });

  test('PUT /shared-account/:id updates account name', async () => {
    const createRes = await collections.sharedAccounts!.insertOne({ nombre: 'Original', moneda: 'EUR', creador_id: 'u4', fecha_creacion: new Date() });
    const id = createRes.insertedId.toString();

    const updated = { nombre: 'Updated Name' };
    await request(app).put(`/shared-account/${id}`).send(updated).expect(200);

    const fetched = await collections.sharedAccounts!.findOne({ _id: createRes.insertedId });
    expect((fetched as any).nombre).toBe('Updated Name');
  });

  test('PUT /shared-account/:id returns 404 for non-existent account', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    await request(app).put(`/shared-account/${fakeId}`).send({ nombre: 'Fail' }).expect(404);
  });

  test('DELETE /shared-account/:id removes account', async () => {
    const createRes = await collections.sharedAccounts!.insertOne({ nombre: 'ToDelete', moneda: 'EUR', creador_id: 'u5', fecha_creacion: new Date() });
    const id = createRes.insertedId.toString();

    await request(app).delete(`/shared-account/${id}`).expect(202);

    const deleted = await collections.sharedAccounts!.findOne({ _id: createRes.insertedId });
    expect(deleted).toBeNull();
  });

  test('DELETE /shared-account/:id returns 404 for non-existent account', async () => {
    const fakeId = '507f1f77bcf86cd799439012';
    await request(app).delete(`/shared-account/${fakeId}`).expect(404);
  });

  test('GET /shared-account/:id returns 404 for non-existent account', async () => {
    const fakeId = '507f1f77bcf86cd799439013';
    await request(app).get(`/shared-account/${fakeId}`).expect(404);
  });
});
