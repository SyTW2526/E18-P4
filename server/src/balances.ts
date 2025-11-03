import { collections } from "./database";
import { ObjectId } from "mongodb";

type Balance = {
  userId: string;
  paid: number;
  share: number;
  balance: number;
};

/**
 * Calcula los balances de los usuarios en un grupo.
 * - Busca los gastos de la colección `gastos` con `id_grupo` igual a groupId.
 * - Para cada gasto, intenta leer participaciones en `participaciones` (monto_asignado).
 *   Si hay participaciones, utiliza esos montos; si no, reparte el gasto igual entre los miembros del grupo (userGroups).
 */
export async function computeGroupBalances(groupId: string): Promise<Balance[]> {
  if (!collections.gastos) throw new Error("Colección 'gastos' no está inicializada");

  const gastos = await collections.gastos.find({ id_grupo: groupId }).toArray();

  // obtener miembros del grupo si es necesario (lazy)
  const getMembers = async (): Promise<string[]> => {
    if (!collections.userGroups) return [];
    const rows = await collections.userGroups.find({ id_grupo: groupId }).project({ id_usuario: 1 }).toArray();
    return rows.map((r: any) => String(r.id_usuario));
  };

  const agg: Record<string, { paid: number; share: number }> = {};
  const ensure = (uid: string) => {
    if (!agg[uid]) agg[uid] = { paid: 0, share: 0 };
    return agg[uid];
  };

  for (const g of gastos) {
    const monto = Number(g.monto) || 0;
    const pagador = String(g.id_pagador ?? g.id_pagador ?? g.id_pagador);
    ensure(pagador).paid += monto;

    // intentar usar participaciones
    let parts: { id_usuario: string; monto_asignado: number }[] = [];
    if (collections.participaciones) {
      // intentamos buscar participaciones por id_gasto (coincidiendo por string y por ObjectId)
      const gastoId = g._id as ObjectId | undefined;
      const q: any = { id_gasto: String(gastoId ?? g.id_gasto ?? "") };
      const raw = await collections.participaciones.find(q).toArray();
      parts = raw.map((p: any) => ({ id_usuario: String(p.id_usuario), monto_asignado: Number(p.monto_asignado) || 0 }));
    }

    if (parts && parts.length) {
      for (const p of parts) {
        const uid = String(p.id_usuario);
        const assigned = Number(p.monto_asignado) || 0;
        ensure(uid).share += assigned;
      }
    } else {
      // reparto igual entre miembros del grupo
      const members = await getMembers();
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

  const result: Balance[] = Object.keys(agg).map((u) => {
    const paid = Math.round(agg[u].paid * 100) / 100;
    const share = Math.round(agg[u].share * 100) / 100;
    return { userId: u, paid, share, balance: Math.round((paid - share) * 100) / 100 };
  });

  return result;
}
