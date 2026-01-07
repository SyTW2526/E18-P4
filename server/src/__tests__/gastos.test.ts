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

  test('POST /gastos with participacion saves participantes correctly', async () => {
    const grupoId = 'grupo456';
    const gasto = { 
      id_grupo: grupoId, 
      descripcion: 'Dinner', 
      monto: 60, 
      id_pagador: 'u1', 
      fecha: new Date().toISOString(), 
      categoria: 'restaurant',
      participacion: [
        { id_usuario: 'u1', monto: 30 },
        { id_usuario: 'u2', monto: 30 }
      ]
    };
    const postRes = await request(app).post('/gastos').send(gasto).expect(201);
    expect(postRes.body).toHaveProperty('id');

    // Verify participaciones were created
    const gastoId = postRes.body.id;
    const participaciones = await collections.participaciones!.find({ id_gasto: gastoId }).toArray();
    expect(participaciones.length).toBe(2);
    expect(participaciones[0]).toHaveProperty('monto_asignado');
    expect(participaciones[0].monto_asignado).toBe(30);
  });

  test('PUT /gastos/:id updates gasto successfully', async () => {
    const grupoId = 'grupo789';
    const gasto = { id_grupo: grupoId, descripcion: 'Coffee', monto: 5, id_pagador: 'u2', fecha: new Date().toISOString(), categoria: 'cafe' };
    const postRes = await request(app).post('/gastos').send(gasto).expect(201);
    const gastoId = postRes.body.id;

    const updated = { descripcion: 'Coffee and Croissant', monto: 8 };
    await request(app).put(`/gastos/${gastoId}`).send(updated).expect(200);

    const getRes = await request(app).get(`/gastos/${gastoId}`).expect(200);
    expect(getRes.body).toHaveProperty('descripcion', 'Coffee and Croissant');
    expect(getRes.body).toHaveProperty('monto', 8);
  });

  test('PUT /gastos/:id returns 404 for non-existent gasto', async () => {
    const fakeId = '507f1f77bcf86cd799439011'; // valid ObjectId but doesn't exist
    const updated = { descripcion: 'Updated', monto: 10 };
    await request(app).put(`/gastos/${fakeId}`).send(updated).expect(404);
  });

  test('DELETE /gastos/:id removes gasto', async () => {
    const grupoId = 'grupo999';
    const gasto = { id_grupo: grupoId, descripcion: 'To Delete', monto: 15, id_pagador: 'u3', fecha: new Date().toISOString(), categoria: 'other' };
    const postRes = await request(app).post('/gastos').send(gasto).expect(201);
    const gastoId = postRes.body.id;

    await request(app).delete(`/gastos/${gastoId}`).expect(200);

    // Verify it's deleted
    await request(app).get(`/gastos/${gastoId}`).expect(404);
  });

  test('DELETE /gastos/:id returns 404 for non-existent gasto', async () => {
    const fakeId = '507f1f77bcf86cd799439012';
    await request(app).delete(`/gastos/${fakeId}`).expect(404);
  });

  test('GET /gastos/grupo/:id_grupo returns empty array when no gastos exist', async () => {
    const emptyGroupId = 'emptygroup123';
    const res = await request(app).get(`/gastos/grupo/${emptyGroupId}`).expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(0);
  });

  test('GET /gastos/:id returns 404 for invalid ObjectId', async () => {
    await request(app).get('/gastos/invalidid').expect(500);
  });

  test('POST /gastos accepts minimal fields', async () => {
    // Test with minimal but valid fields
    const minimal = { id_grupo: 'minimal123', descripcion: 'Test', monto: 10, id_pagador: 'u1', fecha: new Date().toISOString(), categoria: '' };
    const res = await request(app).post('/gastos').send(minimal).expect(201);
    expect(res.body).toHaveProperty('id');
  });
});
