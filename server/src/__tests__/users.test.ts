import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { userRouter } from '../routes/users.route';

let mongod: MongoMemoryServer | null = null;
let app: express.Express;

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
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
  app.use('/users', userRouter);
});

afterAll(async () => {
  try { await closeDatabase(); } catch (e) {}
  if (mongod) {
    try { await mongod.stop(); } catch (e) {}
  }
});

describe('users routes', () => {
  test('POST /users creates a user and GET returns it', async () => {
    const payload = { nombre: 'Test User', email: 'test@example.com', password: 'pass123', preferencia_tema: 'claro' };
    const res = await request(app).post('/users').send(payload).expect(201);

    const found = await collections.users!.findOne({ email: 'test@example.com' });
    expect(found).toBeTruthy();
    expect((found as any).nombre).toBe('Test User');
  });

  test('POST /users/signup returns user and token', async () => {
    const payload = { nombre: 'Signup User', email: 'signup@example.com', password: 'secure' };
    const res = await request(app).post('/users/signup').send(payload).expect(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('token');
  });
});
