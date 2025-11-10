import * as dotenv from 'dotenv';
import { connectToDatabase, collections } from './database';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const { ATLAS_URI } = process.env;
if (!ATLAS_URI) {
  console.error('ATLAS_URI not set in environment');
  process.exit(1);
}

async function seed() {
  await connectToDatabase(ATLAS_URI as string);

  // Sample users
  const usersToCreate = [
    { nombre: 'Diego', email: 'diego@example.com', password: 'password123' },
    { nombre: 'Dani', email: 'dani@example.com', password: 'password123' },
    { nombre: 'Edu', email: 'edu@example.com', password: 'password123' },
  ];

  const createdUsers: any[] = [];

  for (const u of usersToCreate) {
    const existing = await collections.users!.findOne({ email: u.email.toLowerCase() });
    if (existing) {
      console.log(`User ${u.email} exists, using existing id ${existing._id}`);
      createdUsers.push(existing);
      continue;
    }

    const doc = {
      nombre: u.nombre,
      email: u.email.toLowerCase(),
      password_hash: bcrypt.hashSync(u.password, 10),
      fecha_registro: new Date(),
      preferencia_tema: 'claro',
    } as any;

    const res = await collections.users!.insertOne(doc);
    if (res.acknowledged) {
      doc._id = res.insertedId;
      createdUsers.push(doc);
      console.log(`Inserted user ${u.email} id=${res.insertedId}`);
    }
  }

  // Create a shared account (group)
  const groupName = 'Viaje Ejemplo';
  let group = await collections.sharedAccounts!.findOne({ nombre: groupName });
  if (!group) {
    const creator = createdUsers[0];
    const groupDoc: any = {
      nombre: groupName,
      descripcion: 'Grupo de ejemplo con gastos de prueba',
      moneda: 'EUR',
      creador_id: creator?._id?.toString() || (createdUsers[0]?._id?.toString() || ''),
      fecha_creacion: new Date(),
    };
    const gres = await collections.sharedAccounts!.insertOne(groupDoc);
    if (gres.acknowledged) {
      groupDoc._id = gres.insertedId;
      group = groupDoc;
      console.log(`Created group ${groupName} id=${gres.insertedId}`);
    }
  } else {
    console.log(`Group ${groupName} already exists id=${group._id}`);
  }

  if (!group || !group._id) {
    console.error('Failed to create or find group');
    process.exit(1);
  }
  const groupIdStr = group._id.toString();

  // Link users to group via user_groups collection
  for (const u of createdUsers) {
    const exists = await collections.userGroups!.findOne({ id_usuario: u._id.toString(), id_grupo: groupIdStr });
    if (exists) {
      console.log(`user_groups relation for ${u.email} exists`);
      continue;
    }
    const ug = { id_usuario: u._id.toString(), id_grupo: groupIdStr, rol: 'miembro', fecha_union: new Date() };
    const r = await collections.userGroups!.insertOne(ug as any);
    if (r.acknowledged) console.log(`Added ${u.email} to group`);
  }

  // Create sample gastos and participaciones
  const gastosToCreate = [
    { descripcion: 'Cena grupo', monto: 120.0, pagadorIndex: 0, categoria: 'Comida' },
    { descripcion: 'Taxi aeropuerto', monto: 60.0, pagadorIndex: 1, categoria: 'Transporte' },
  ];

  for (const g of gastosToCreate) {
    const gastoDoc: any = {
      id_grupo: groupIdStr,
      descripcion: g.descripcion,
      monto: g.monto,
      id_pagador: createdUsers[g.pagadorIndex]._id.toString(),
      fecha: new Date(),
      categoria: g.categoria,
    };
    const gres = await collections.gastos!.insertOne(gastoDoc);
    if (gres.acknowledged) {
      console.log(`Inserted gasto ${g.descripcion} id=${gres.insertedId}`);
      const gastoIdStr = gres.insertedId.toString();
      // create participaciones: split equally among users
      const per = +(g.monto / createdUsers.length).toFixed(2);
      for (const u of createdUsers) {
        const part = { id_usuario: u._id.toString(), id_gasto: gastoIdStr, monto_asignado: per };
        const pres = await collections.participaciones!.insertOne(part as any);
        if (pres.acknowledged) {
          // nothing
        }
      }
    }
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeder error', err);
  process.exit(1);
});
