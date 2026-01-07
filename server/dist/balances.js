"use strict";
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
exports.computeGroupBalances = computeGroupBalances;
exports.computeDetailedBalances = computeDetailedBalances;
const database_1 = require("./database");
/**
 * Calcula los balances de los usuarios en un grupo.
 * - Busca los gastos de la colección `gastos` con `id_grupo` igual a groupId.
 * - Para cada gasto, intenta leer participaciones en `participaciones` (monto_asignado).
 *   Si hay participaciones, utiliza esos montos; si no, reparte el gasto igual entre los miembros del grupo (userGroups).
 */
function computeGroupBalances(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        if (!database_1.collections.gastos)
            throw new Error("Colección 'gastos' no está inicializada");
        const gastos = (yield database_1.collections.gastos.find({ id_grupo: groupId }).toArray());
        // obtener miembros del grupo si es necesario (lazy)
        const getMembers = () => __awaiter(this, void 0, void 0, function* () {
            if (!database_1.collections.userGroups)
                return [];
            const rows = (yield database_1.collections.userGroups
                .find({ id_grupo: groupId })
                .project({ id_usuario: 1 })
                .toArray());
            return rows.map((r) => String(r.id_usuario));
        });
        const agg = {};
        const ensure = (uid) => {
            if (!agg[uid])
                agg[uid] = { paid: 0, share: 0 };
            return agg[uid];
        };
        for (const g of gastos) {
            const monto = Number(g.monto) || 0;
            const pagador = String((_b = (_a = g.id_pagador) !== null && _a !== void 0 ? _a : g.id_pagador) !== null && _b !== void 0 ? _b : g.id_pagador);
            ensure(pagador).paid += monto;
            // intentar usar participaciones
            let parts = [];
            if (database_1.collections.participaciones) {
                // intentamos buscar participaciones por id_gasto (coincidiendo por ObjectId y por string)
                const gastoIdStr = String((_d = (_c = g.id_gasto) !== null && _c !== void 0 ? _c : g._id) !== null && _d !== void 0 ? _d : "");
                const q = { id_gasto: gastoIdStr };
                const raw = (yield database_1.collections.participaciones.find(q).toArray());
                parts = raw.map((p) => ({ id_usuario: String(p.id_usuario), monto_asignado: Number(p.monto_asignado) || 0 }));
            }
            if (parts && parts.length) {
                for (const p of parts) {
                    const uid = String(p.id_usuario);
                    const assigned = Number(p.monto_asignado) || 0;
                    ensure(uid).share += assigned;
                }
            }
            else {
                // reparto igual entre miembros del grupo
                const members = yield getMembers();
                const N = members.length || 1;
                const per = monto / N;
                for (const m of members) {
                    ensure(String(m)).share += per;
                }
                // if no members found, assign all share to pagador
                if (members.length === 0) {
                    ensure(pagador).share += monto;
                }
            }
        }
        const result = Object.keys(agg).map((u) => {
            const paid = Math.round(agg[u].paid * 100) / 100;
            const share = Math.round(agg[u].share * 100) / 100;
            return { userId: u, paid, share, balance: Math.round((paid - share) * 100) / 100 };
        });
        return result;
    });
}
/**
 * Calcula el balance detallado: quién debe dinero a quién.
 * Devuelve para cada usuario:
 * - owes: lista de usuarios a los que le debe dinero y cantidad
 * - owesMoney: lista de usuarios que le deben dinero a él y cantidad
 */
function computeDetailedBalances(groupId) {
    return __awaiter(this, void 0, void 0, function* () {
        const balances = yield computeGroupBalances(groupId);
        // Obtener información de usuarios
        const userMap = {};
        if (database_1.collections.users) {
            const users = yield database_1.collections.users.find({}).toArray();
            for (const u of users) {
                userMap[String(u._id || u.id)] = {
                    email: u.email,
                    name: u.nombre || u.name
                };
            }
        }
        // Crear un mapa de balances para cálculos de deudas
        const balanceMap = {};
        for (const b of balances) {
            balanceMap[b.userId] = b.balance;
        }
        // Calcular quien debe a quién
        const detailed = balances.map((b) => {
            var _a, _b;
            return ({
                userId: b.userId,
                userEmail: (_a = userMap[b.userId]) === null || _a === void 0 ? void 0 : _a.email,
                userName: (_b = userMap[b.userId]) === null || _b === void 0 ? void 0 : _b.name,
                paid: b.paid,
                share: b.share,
                balance: b.balance,
                owes: [],
                owesMoney: [],
            });
        });
        // Algoritmo simple: si usuario A tiene balance positivo y B negativo, A es acreedor y B deudor
        // Distribuir los montos entre deudores y acreedores
        for (let i = 0; i < detailed.length; i++) {
            if (detailed[i].balance < 0) {
                // Este usuario debe dinero
                let debtRemaining = Math.abs(detailed[i].balance);
                for (let j = 0; j < detailed.length; j++) {
                    if (i !== j && detailed[j].balance > 0 && debtRemaining > 0) {
                        // detailed[j] es acreedor, detailed[i] le debe
                        const amount = Math.min(debtRemaining, detailed[j].balance);
                        detailed[i].owes.push({
                            userId: detailed[j].userId,
                            userEmail: detailed[j].userEmail,
                            userName: detailed[j].userName,
                            amount: Math.round(amount * 100) / 100,
                        });
                        debtRemaining -= amount;
                    }
                }
            }
        }
        // Para acreedores: quién les debe dinero
        for (let i = 0; i < detailed.length; i++) {
            if (detailed[i].balance > 0) {
                // Este usuario es acreedor
                for (let j = 0; j < detailed.length; j++) {
                    if (i !== j && detailed[j].balance < 0) {
                        // detailed[j] tiene deuda, buscar si tiene deuda con detailed[i]
                        const owesEntry = detailed[j].owes.find(o => o.userId === detailed[i].userId);
                        if (owesEntry) {
                            detailed[i].owesMoney.push({
                                userId: detailed[j].userId,
                                userEmail: detailed[j].userEmail,
                                userName: detailed[j].userName,
                                amount: owesEntry.amount,
                            });
                        }
                    }
                }
            }
        }
        return detailed;
    });
}
