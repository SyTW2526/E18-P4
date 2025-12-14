import express from 'express';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectToDatabase, collections, closeDatabase } from '../database';
import { userRouter } from '../routes/users.route';

// Mock Google OAuth client to avoid external calls during tests
jest.mock('google-auth-library', () => {
  const verifyIdToken = jest.fn().mockResolvedValue({
    getPayload: () => ({
      sub: 'google123',
      email: 'google@example.com',
      name: 'Google User',
      picture: 'pic-url'
    })
  });

  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({ verifyIdToken }))
  };
});

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

  describe('POST /users/signin-google', () => {
    test('returns 400 when token is missing', async () => {
      const res = await request(app).post('/users/signin-google').send({}).expect(400);
      expect(res.text).toMatch(/token/i);
    });

    test('creates or logs in user with Google payload', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client-id';
      process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

      const res = await request(app)
        .post('/users/signin-google')
        .send({ token: 'fake-valid-token' })
        .expect(200);

      expect(res.body).toHaveProperty('user.email', 'google@example.com');
      expect(res.body).toHaveProperty('user.google_id', 'google123');
      expect(res.body).toHaveProperty('token');

      const saved = await collections.users!.findOne({ email: 'google@example.com' });
      expect(saved).toBeTruthy();
      expect((saved as any).google_id).toBe('google123');
    });
  });
});
