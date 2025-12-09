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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.userGroupRouter = void 0;
const express = __importStar(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("../database");
const balances_1 = require("../balances");
exports.userGroupRouter = express.Router();
// Obtener todas las cuentas/grupos compartidos
exports.userGroupRouter.get("/shared-accounts", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sharedAccounts = yield database_1.collections.sharedAccounts.find({}).toArray();
        res.status(200).json(sharedAccounts);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener las cuentas compartidas.", error });
    }
}));
// Obtener una cuenta/grupo compartido por su ID de MongoDB
exports.userGroupRouter.get("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const item = yield database_1.collections.sharedAccounts.findOne(query);
        if (item) {
            res.status(200).send(item);
        }
        else {
            res.status(404).send({ message: "Cuenta compartida no encontrada." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al obtener la cuenta compartida.", error });
    }
}));
// Obtener miembros (usuarios) de una cuenta compartida usando user_groups
exports.userGroupRouter.get("/shared-accounts/:id/members", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const rows = yield database_1.collections.userGroups.find({ id_grupo: String(id) }).toArray();
        const userIds = rows.map(r => String(r.id_usuario));
        const rolesByUser = {};
        rows.forEach(r => { rolesByUser[String(r.id_usuario)] = r.rol; });
        const users = yield database_1.collections.users.find({ $or: userIds.map(u => ({ _id: new mongodb_1.ObjectId(u) })) }).toArray().catch(() => []);
        if (!users || users.length === 0) {
            const minimal = userIds.map(u => ({ _id: u, rol: rolesByUser[u] || 'miembro' }));
            return res.status(200).send(minimal);
        }
        const enriched = users.map(u => (Object.assign(Object.assign({}, u), { rol: rolesByUser[String(u._id)] || 'miembro' })));
        res.status(200).send(enriched);
    }
    catch (error) {
        console.error('members fetch error', error);
        res.status(500).send({ message: 'Error al obtener miembros del grupo', error });
    }
}));
// Obtener los grupos a los que pertenece un usuario (devuelve documentos de sharedAccounts)
exports.userGroupRouter.get('/user-groups/user/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // buscar relaciones user_groups por id_usuario
        const rows = yield database_1.collections.userGroups.find({ id_usuario: String(id) }).toArray();
        if (!rows || rows.length === 0)
            return res.status(200).json([]);
        // extraer ids de grupo válidos (24-char hex)
        const grupoIds = rows.map(r => String(r.id_grupo)).filter((g) => typeof g === 'string' && g.match(/^[0-9a-fA-F]{24}$/));
        if (!grupoIds.length) {
            // fallback: return minimal objects with ids when they are not ObjectId strings
            return res.status(200).json(rows.map(r => ({ id: r.id_grupo })));
        }
        const objectIds = grupoIds.map((g) => new mongodb_1.ObjectId(g));
        const groups = yield database_1.collections.sharedAccounts.find({ _id: { $in: objectIds } }).toArray();
        return res.status(200).json(groups);
    }
    catch (error) {
        console.error('user-groups by user fetch error', error);
        return res.status(500).json({ message: 'Error al obtener grupos del usuario', error });
    }
}));
// Obtener balances calculados para una cuenta/grupo compartido
exports.userGroupRouter.get("/shared-accounts/:id/balances", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const balances = yield (0, balances_1.computeGroupBalances)(id);
        // intentar enriquecer con datos de usuario (nombre/email)
        const userIds = balances.map(b => String(b.userId));
        const users = yield database_1.collections.users.find({ $or: userIds.map(u => ({ _id: new mongodb_1.ObjectId(u) })) }).toArray().catch(() => []);
        const usersById = {};
        users.forEach(u => { usersById[String(u._id)] = u; });
        const result = balances.map(b => (Object.assign(Object.assign({}, b), { user: usersById[b.userId] || { _id: b.userId } })));
        res.status(200).json(result);
    }
    catch (error) {
        console.error('balances fetch error', error);
        res.status(500).send({ message: 'Error al calcular balances', error: error instanceof Error ? error.message : error });
    }
}));
// Obtener balances detallados (quién debe a quién)
exports.userGroupRouter.get("/shared-accounts/:id/balances-detailed", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const detailedBalances = yield (0, balances_1.computeDetailedBalances)(id);
        res.status(200).json(detailedBalances);
    }
    catch (error) {
        console.error('detailed balances fetch error', error);
        res.status(500).send({ message: 'Error al calcular balances detallados', error: error instanceof Error ? error.message : error });
    }
}));
// Crear una nueva cuenta/grupo compartido
exports.userGroupRouter.post("/shared-accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuenta = req.body;
        // asegurar que la fecha de creación sea un objeto Date
        if (!cuenta.fecha_creacion) {
            cuenta.fecha_creacion = new Date();
        }
        else {
            cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
        }
        if (cuenta.moneda && typeof cuenta.moneda === "string") {
            cuenta.moneda = cuenta.moneda.toUpperCase();
        }
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.insertOne(cuenta));
        if (result && result.insertedId) {
            // If payload included a creator, auto-create a user_groups relation so the
            // creator is immediately a member/admin of the group and it will appear
            // in their "my groups" list.
            let creatorMembershipId = null;
            try {
                if (cuenta.creador_id) {
                    const membershipDoc = {
                        id_usuario: String(cuenta.creador_id),
                        id_grupo: String(result.insertedId),
                        rol: 'owner',
                        fecha_union: new Date(),
                    };
                    const mres = yield database_1.collections.userGroups.insertOne(membershipDoc);
                    if (mres && mres.insertedId)
                        creatorMembershipId = String(mres.insertedId);
                }
            }
            catch (e) {
                // Log and continue: group was created, but auto-join failed.
                console.error('Failed to create creator membership for new group', e);
            }
            return res.status(201).send({ message: 'Cuenta compartida creada.', id: result.insertedId, creatorMembershipId });
        }
        else {
            return res.status(500).send({ message: 'Error al crear la cuenta compartida.' });
        }
    }
    catch (error) {
        console.error('POST /shared-accounts error', error);
        // Return more useful error information when possible
        const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
        const errInfo = {};
        try {
            // try to pull common properties from MongoServerError-like objects
            errInfo.name = error === null || error === void 0 ? void 0 : error.name;
            errInfo.code = error === null || error === void 0 ? void 0 : error.code;
            errInfo.errInfo = error === null || error === void 0 ? void 0 : error.errInfo;
        }
        catch (e) { }
        res.status(400).send({ message: "Error al crear la cuenta compartida.", error: Object.assign({ message: errMsg }, errInfo) });
    }
}));
// Crear relación usuario-grupo (unirse a un grupo) usando la colección user_groups
exports.userGroupRouter.post("/user-groups", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const body = req.body || {};
        const id_usuario = body.id_usuario;
        const id_grupo = body.id_grupo;
        const rol = body.rol || 'miembro';
        if (!id_usuario || !id_grupo) {
            return res.status(400).send({ message: 'id_usuario y id_grupo son requeridos' });
        }
        const doc = {
            id_usuario: String(id_usuario),
            id_grupo: String(id_grupo),
            rol: String(rol),
            fecha_union: new Date(),
        };
        const result = yield database_1.collections.userGroups.insertOne(doc);
        if (result && result.insertedId) {
            res.status(201).send({ message: 'Usuario unido al grupo', id: result.insertedId });
        }
        else {
            res.status(500).send({ message: 'No se pudo crear la relación usuario-grupo' });
        }
    }
    catch (error) {
        // duplicate key (already a member)
        if ((error === null || error === void 0 ? void 0 : error.code) === 11000) {
            return res.status(409).send({ message: 'El usuario ya forma parte del grupo' });
        }
        console.error('user-groups POST error', error);
        res.status(500).send({ message: 'Error al unir al usuario al grupo', error });
    }
}));
// Actualizar rol de un miembro (solo owner)
exports.userGroupRouter.put('/user-groups/:groupId/role', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const groupId = req.params.groupId;
        const { requesterId, targetUserId, role } = req.body || {};
        if (!requesterId || !targetUserId || !role) {
            return res.status(400).send({ message: 'requesterId, targetUserId y role son requeridos' });
        }
        if (!['admin', 'miembro'].includes(role)) {
            return res.status(400).send({ message: 'role debe ser admin o miembro' });
        }
        const requester = yield database_1.collections.userGroups.findOne({ id_usuario: String(requesterId), id_grupo: String(groupId) });
        if (!requester || requester.rol !== 'owner') {
            return res.status(403).send({ message: 'Solo el owner puede cambiar roles' });
        }
        const target = yield database_1.collections.userGroups.findOne({ id_usuario: String(targetUserId), id_grupo: String(groupId) });
        if (!target) {
            return res.status(404).send({ message: 'Miembro no encontrado en el grupo' });
        }
        if (target.rol === 'owner') {
            return res.status(400).send({ message: 'No se puede modificar el rol del owner' });
        }
        yield database_1.collections.userGroups.updateOne({ _id: target._id }, { $set: { rol: role } });
        return res.status(200).send({ message: 'Rol actualizado' });
    }
    catch (error) {
        console.error('update role error', error);
        return res.status(500).send({ message: 'Error al actualizar el rol', error });
    }
}));
// Expulsar miembro (owner o admin). Admin solo puede expulsar miembros.
exports.userGroupRouter.delete('/user-groups', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requesterId, targetUserId, groupId } = req.body || {};
        if (!requesterId || !targetUserId || !groupId) {
            return res.status(400).send({ message: 'requesterId, targetUserId y groupId son requeridos' });
        }
        const requester = yield database_1.collections.userGroups.findOne({ id_usuario: String(requesterId), id_grupo: String(groupId) });
        if (!requester || (requester.rol !== 'owner' && requester.rol !== 'admin')) {
            return res.status(403).send({ message: 'No autorizado para expulsar miembros' });
        }
        const target = yield database_1.collections.userGroups.findOne({ id_usuario: String(targetUserId), id_grupo: String(groupId) });
        if (!target) {
            return res.status(404).send({ message: 'Miembro no encontrado en el grupo' });
        }
        if (target.rol === 'owner') {
            return res.status(400).send({ message: 'No se puede expulsar al owner' });
        }
        if (requester.rol === 'admin' && target.rol !== 'miembro') {
            return res.status(403).send({ message: 'Los admins solo pueden expulsar miembros' });
        }
        yield database_1.collections.userGroups.deleteOne({ _id: target._id });
        return res.status(200).send({ message: 'Miembro expulsado' });
    }
    catch (error) {
        console.error('remove member error', error);
        return res.status(500).send({ message: 'Error al expulsar al miembro', error });
    }
}));
// Actualizar cuenta/grupo compartido
exports.userGroupRouter.put("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const cuenta = req.body;
        // asegurar que la fecha de creación sea un objeto Date si se proporciona
        if (cuenta.fecha_creacion) {
            cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
        }
        if (cuenta.moneda && typeof cuenta.moneda === "string") {
            cuenta.moneda = cuenta.moneda.toUpperCase();
        }
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.updateOne(query, { $set: cuenta }));
        if (result === null || result === void 0 ? void 0 : result.acknowledged) {
            res.status(201).send(`Created a new shared account: ID ${result.upsertedId}.`);
        }
        else {
            res.status(500).send("Failed to create a new shared account.");
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// Eliminar cuenta/grupo compartido (solo owner)
exports.userGroupRouter.delete("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { requesterId } = req.body || {};
        if (!requesterId) {
            return res.status(400).send({ message: 'requesterId es requerido' });
        }
        // Check if requester is owner of the group
        const requester = yield database_1.collections.userGroups.findOne({ id_usuario: String(requesterId), id_grupo: String(id) });
        if (!requester || requester.rol !== 'owner') {
            return res.status(403).send({ message: 'Solo el owner puede eliminar el grupo' });
        }
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.deleteOne(query));
        if (result && result.deletedCount) {
            // Also delete all user_groups relations for this group
            yield database_1.collections.userGroups.deleteMany({ id_grupo: String(id) }).catch(err => console.error('Failed to clean up user_groups', err));
            res.status(202).send({ message: "Cuenta compartida eliminada." });
        }
        else {
            res.status(404).send({ message: "Cuenta compartida no encontrada." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al eliminar la cuenta compartida.", error });
    }
}));
