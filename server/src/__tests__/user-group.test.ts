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

  test('GET /user-group/shared-accounts lists all groups', async () => {
    const res = await request(app).get('/user-group/shared-accounts').expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /user-group/shared-accounts/:id returns specific group', async () => {
    const createRes = await collections.sharedAccounts!.insertOne({ nombre: 'GetTest', moneda: 'USD', creador_id: 'u3', fecha_creacion: new Date() });
    const groupId = createRes.insertedId.toString();

    const res = await request(app).get(`/user-group/shared-accounts/${groupId}`).expect(200);
    expect(res.body).toHaveProperty('nombre', 'GetTest');
  });

  test('GET /user-group/shared-accounts/:id returns 404 for non-existent group', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    await request(app).get(`/user-group/shared-accounts/${fakeId}`).expect(404);
  });

  test('POST /user-group/user-groups adds user to group', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'JoinTest', moneda: 'EUR', creador_id: 'u4', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();

    const payload = { id_usuario: 'u5', id_grupo: groupId, rol: 'miembro' };
    const res = await request(app).post('/user-group/user-groups').send(payload).expect(201);
    expect(res.body).toHaveProperty('id');

    // Verify membership
    const membership = await collections.userGroups!.findOne({ id_usuario: 'u5', id_grupo: groupId });
    expect(membership).toBeTruthy();
    expect((membership as any).rol).toBe('miembro');
  });

  test('POST /user-group/user-groups returns 400 when missing required fields', async () => {
    await request(app).post('/user-group/user-groups').send({ id_usuario: 'u6' }).expect(400);
  });

  test('POST /user-group/user-groups returns 409 on duplicate membership', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'DupeTest', moneda: 'EUR', creador_id: 'u7', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();

    const payload = { id_usuario: 'u7', id_grupo: groupId, rol: 'miembro' };
    await request(app).post('/user-group/user-groups').send(payload).expect(201);
    
    // Try to join again - should fail with 409
    await request(app).post('/user-group/user-groups').send(payload).expect(409);
  });

  test('GET /user-group/shared-accounts/:id/members returns members with roles', async () => {
    // Create users first with valid ObjectIds
    const user8Res = await collections.users!.insertOne({ nombre: 'User8', email: 'u8@test.com', password_hash: 'hash', fecha_registro: new Date(), preferencia_tema: 'claro' });
    const user9Res = await collections.users!.insertOne({ nombre: 'User9', email: 'u9@test.com', password_hash: 'hash', fecha_registro: new Date(), preferencia_tema: 'claro' });
    const user8Id = user8Res.insertedId.toString();
    const user9Id = user9Res.insertedId.toString();
    
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'MembersTest', moneda: 'EUR', creador_id: user8Id, fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    
    await collections.userGroups!.insertOne({ id_usuario: user8Id, id_grupo: groupId, rol: 'owner', fecha_union: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: user9Id, id_grupo: groupId, rol: 'miembro', fecha_union: new Date() });

    const res = await request(app).get(`/user-group/shared-accounts/${groupId}/members`).expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
    expect(res.body.length).toBe(2);
  });

  test('GET /user-group/shared-accounts/:id/balances returns balances', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'BalanceTest', moneda: 'EUR', creador_id: 'u10', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();

    const res = await request(app).get(`/user-group/shared-accounts/${groupId}/balances`).expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /user-group/shared-accounts/:id/balances-detailed returns detailed balances', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'DetailedBalanceTest', moneda: 'EUR', creador_id: 'u11', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();

    const res = await request(app).get(`/user-group/shared-accounts/${groupId}/balances-detailed`).expect(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('PUT /user-group/user-groups/:groupId/role updates member role (owner only)', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'RoleTest', moneda: 'EUR', creador_id: 'u12', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u12', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: 'u13', id_grupo: groupId, rol: 'miembro', fecha_union: new Date() });

    const payload = { requesterId: 'u12', targetUserId: 'u13', role: 'admin' };
    const res = await request(app).put(`/user-group/user-groups/${groupId}/role`).send(payload).expect(200);
    expect(res.body).toHaveProperty('message', 'Rol actualizado');

    // Verify role was updated
    const updated = await collections.userGroups!.findOne({ id_usuario: 'u13', id_grupo: groupId });
    expect((updated as any).rol).toBe('admin');
  });

  test('PUT /user-group/user-groups/:groupId/role returns 403 when non-owner tries to change role', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'RoleTest2', moneda: 'EUR', creador_id: 'u14', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u14', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: 'u15', id_grupo: groupId, rol: 'miembro', fecha_union: new Date() });

    const payload = { requesterId: 'u15', targetUserId: 'u14', role: 'miembro' };
    await request(app).put(`/user-group/user-groups/${groupId}/role`).send(payload).expect(403);
  });

  test('DELETE /user-group/user-groups removes member (owner can remove)', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'RemoveTest', moneda: 'EUR', creador_id: 'u16', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u16', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: 'u17', id_grupo: groupId, rol: 'miembro', fecha_union: new Date() });

    const payload = { requesterId: 'u16', targetUserId: 'u17', groupId };
    await request(app).delete('/user-group/user-groups').send(payload).expect(200);

    // Verify member was removed
    const removed = await collections.userGroups!.findOne({ id_usuario: 'u17', id_grupo: groupId });
    expect(removed).toBeNull();
  });

  test('DELETE /user-group/user-groups returns 400 when trying to remove owner', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'RemoveOwnerTest', moneda: 'EUR', creador_id: 'u18', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u18', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });

    const payload = { requesterId: 'u18', targetUserId: 'u18', groupId };
    await request(app).delete('/user-group/user-groups').send(payload).expect(400);
  });

  test('PUT /user-group/shared-accounts/:id updates group info', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'UpdateTest', moneda: 'EUR', creador_id: 'u19', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();

    const updated = { nombre: 'UpdatedName', moneda: 'USD' };
    await request(app).put(`/user-group/shared-accounts/${groupId}`).send(updated).expect(200);

    const fetched = await collections.sharedAccounts!.findOne({ _id: groupRes.insertedId });
    expect((fetched as any).nombre).toBe('UpdatedName');
    expect((fetched as any).moneda).toBe('USD');
  });

  test('DELETE /user-group/shared-accounts/:id removes group (owner only)', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'DeleteTest', moneda: 'EUR', creador_id: 'u20', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u20', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });

    const payload = { requesterId: 'u20' };
    await request(app).delete(`/user-group/shared-accounts/${groupId}`).send(payload).expect(202);

    // Verify group was deleted
    const deleted = await collections.sharedAccounts!.findOne({ _id: groupRes.insertedId });
    expect(deleted).toBeNull();
  });

  test('DELETE /user-group/shared-accounts/:id returns 403 when non-owner tries to delete', async () => {
    const groupRes = await collections.sharedAccounts!.insertOne({ nombre: 'DeleteTest2', moneda: 'EUR', creador_id: 'u21', fecha_creacion: new Date() });
    const groupId = groupRes.insertedId.toString();
    await collections.userGroups!.insertOne({ id_usuario: 'u21', id_grupo: groupId, rol: 'owner', fecha_union: new Date() });
    await collections.userGroups!.insertOne({ id_usuario: 'u22', id_grupo: groupId, rol: 'miembro', fecha_union: new Date() });

    const payload = { requesterId: 'u22' };
    await request(app).delete(`/user-group/shared-accounts/${groupId}`).send(payload).expect(403);
  });
});
