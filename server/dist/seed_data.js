"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const database_1 = require("./database");
const bcrypt = __importStar(require("bcryptjs"));
dotenv.config();
const { ATLAS_URI } = process.env;
if (!ATLAS_URI) {
    console.error('ATLAS_URI not set in environment');
    process.exit(1);
}
function seed() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, database_1.connectToDatabase)(ATLAS_URI);
        // Sample users
        const usersToCreate = [
            { nombre: 'Diego', email: 'diego@example.com', password: 'password123' },
            { nombre: 'Dani', email: 'dani@example.com', password: 'password123' },
            { nombre: 'Edu', email: 'edu@example.com', password: 'password123' },
        ];
        const createdUsers = [];
        for (const u of usersToCreate) {
            const existing = yield database_1.collections.users.findOne({ email: u.email.toLowerCase() });
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
            };
            const res = yield database_1.collections.users.insertOne(doc);
            if (res.acknowledged) {
                doc._id = res.insertedId;
                createdUsers.push(doc);
                console.log(`Inserted user ${u.email} id=${res.insertedId}`);
            }
        }
        // Create a shared account (group)
        const groupName = 'Viaje Ejemplo';
        let group = yield database_1.collections.sharedAccounts.findOne({ nombre: groupName });
        if (!group) {
            const creator = createdUsers[0];
            const groupDoc = {
                nombre: groupName,
                descripcion: 'Grupo de ejemplo con gastos de prueba',
                moneda: 'EUR',
                creador_id: ((_a = creator === null || creator === void 0 ? void 0 : creator._id) === null || _a === void 0 ? void 0 : _a.toString()) || (((_c = (_b = createdUsers[0]) === null || _b === void 0 ? void 0 : _b._id) === null || _c === void 0 ? void 0 : _c.toString()) || ''),
                fecha_creacion: new Date(),
            };
            const gres = yield database_1.collections.sharedAccounts.insertOne(groupDoc);
            if (gres.acknowledged) {
                groupDoc._id = gres.insertedId;
                group = groupDoc;
                console.log(`Created group ${groupName} id=${gres.insertedId}`);
            }
        }
        else {
            console.log(`Group ${groupName} already exists id=${group._id}`);
        }
        if (!group || !group._id) {
            console.error('Failed to create or find group');
            process.exit(1);
        }
        const groupIdStr = group._id.toString();
        // Link users to group via user_groups collection
        for (const u of createdUsers) {
            const exists = yield database_1.collections.userGroups.findOne({ id_usuario: u._id.toString(), id_grupo: groupIdStr });
            if (exists) {
                console.log(`user_groups relation for ${u.email} exists`);
                continue;
            }
            const ug = { id_usuario: u._id.toString(), id_grupo: groupIdStr, rol: 'miembro', fecha_union: new Date() };
            const r = yield database_1.collections.userGroups.insertOne(ug);
            if (r.acknowledged)
                console.log(`Added ${u.email} to group`);
        }
        // Create sample gastos and participaciones
        const gastosToCreate = [
            { descripcion: 'Cena grupo', monto: 120.0, pagadorIndex: 0, categoria: 'Comida' },
            { descripcion: 'Taxi aeropuerto', monto: 60.0, pagadorIndex: 1, categoria: 'Transporte' },
        ];
        for (const g of gastosToCreate) {
            const gastoDoc = {
                id_grupo: groupIdStr,
                descripcion: g.descripcion,
                monto: g.monto,
                id_pagador: createdUsers[g.pagadorIndex]._id.toString(),
                fecha: new Date(),
                categoria: g.categoria,
            };
            const gres = yield database_1.collections.gastos.insertOne(gastoDoc);
            if (gres.acknowledged) {
                console.log(`Inserted gasto ${g.descripcion} id=${gres.insertedId}`);
                const gastoIdStr = gres.insertedId.toString();
                // create participaciones: split equally among users
                const per = +(g.monto / createdUsers.length).toFixed(2);
                for (const u of createdUsers) {
                    const part = { id_usuario: u._id.toString(), id_gasto: gastoIdStr, monto_asignado: per };
                    const pres = yield database_1.collections.participaciones.insertOne(part);
                    if (pres.acknowledged) {
                        // nothing
                    }
                }
            }
        }
        console.log('Seeding complete.');
        process.exit(0);
    });
}
seed().catch(err => {
    console.error('Seeder error', err);
    process.exit(1);
});
