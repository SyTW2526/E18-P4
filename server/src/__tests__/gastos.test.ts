import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { GastosRouter } from '../routes/gastos.route';

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
  app.use('/gastos', GastosRouter);
});

afterAll(async () => {
  try { await closeDatabase(); } catch (e) {}
  if (mongod) {
    try { await mongod.stop(); } catch (e) {}
  }
});

describe('gastos routes', () => {
  test('POST /gastos and GET /gastos/grupo/:id_grupo work', async () => {
    // create a group id as plain string
    const grupoId = 'grupo123';
    const gasto = { id_grupo: grupoId, descripcion: 'Lunch', monto: 20.5, id_pagador: 'u1', fecha: new Date().toISOString(), categoria: 'food' };
    const postRes = await request(app).post('/gastos').send(gasto).expect(201);
    expect(postRes.body).toHaveProperty('id');

    const listRes = await request(app).get(`/gastos/grupo/${grupoId}`).expect(200);
    expect(Array.isArray(listRes.body)).toBeTruthy();
    expect(listRes.body.length).toBeGreaterThan(0);

    const savedId = postRes.body.id;
    const getRes = await request(app).get(`/gastos/${savedId}`).expect(200);
    expect(getRes.body).toHaveProperty('descripcion', 'Lunch');
  });
});
