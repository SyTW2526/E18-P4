import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { participacionRouter } from '../routes/participacion.route';

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
  app.use('/participacion', participacionRouter);
});

afterAll(async () => {
  try { await closeDatabase(); } catch (e) {}
  if (mongod) {
    try { await mongod.stop(); } catch (e) {}
  }
});

describe('participacion routes', () => {
  test('POST /participacion and query endpoints work', async () => {
    // create a gasto to reference
    const gastoRes = await collections.gastos!.insertOne({ id_grupo: 'g1', descripcion: 'Test', monto: 10, id_pagador: 'u1', fecha: new Date(), categoria: 'other' });
    const id_gasto = gastoRes.insertedId.toString();

    const payload = { id_gasto: id_gasto, id_usuario: 'u99', monto_asignado: 5 };
    const postRes = await request(app).post('/participacion').send(payload).expect(201);
    expect(postRes.body).toHaveProperty('id');

    const listByGasto = await request(app).get(`/participacion/gasto/${id_gasto}`).expect(200);
    expect(Array.isArray(listByGasto.body)).toBeTruthy();
    expect(listByGasto.body.length).toBeGreaterThan(0);

    const listByUsuario = await request(app).get(`/participacion/usuario/u99`).expect(200);
    expect(Array.isArray(listByUsuario.body)).toBeTruthy();
    expect(listByUsuario.body.length).toBeGreaterThan(0);
  });
});
