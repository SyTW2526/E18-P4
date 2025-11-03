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
exports.computeGroupBalances = void 0;
const database_1 = require("./database");
/**
 * Calcula los balances de los usuarios en un grupo.
 * - Busca los gastos de la colección `gastos` con `id_grupo` igual a groupId.
 * - Para cada gasto, intenta leer participaciones en `participaciones` (monto_asignado).
 *   Si hay participaciones, utiliza esos montos; si no, reparte el gasto igual entre los miembros del grupo (userGroups).
 */
function computeGroupBalances(groupId) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        if (!database_1.collections.gastos)
            throw new Error("Colección 'gastos' no está inicializada");
        const gastos = yield database_1.collections.gastos.find({ id_grupo: groupId }).toArray();
        // obtener miembros del grupo si es necesario (lazy)
        const getMembers = () => __awaiter(this, void 0, void 0, function* () {
            if (!database_1.collections.userGroups)
                return [];
            const rows = yield database_1.collections.userGroups.find({ id_grupo: groupId }).project({ id_usuario: 1 }).toArray();
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
                // intentamos buscar participaciones por id_gasto (coincidiendo por string y por ObjectId)
                const gastoId = g._id;
                const q = { id_gasto: String((_c = gastoId !== null && gastoId !== void 0 ? gastoId : g.id_gasto) !== null && _c !== void 0 ? _c : "") };
                const raw = yield database_1.collections.participaciones.find(q).toArray();
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
exports.computeGroupBalances = computeGroupBalances;
