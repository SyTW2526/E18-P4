import { collections } from "./database";
import { ObjectId } from "mongodb";
import { Gasto } from "./gastos";
import { Participacion } from "./participacion";

type Balance = {
  userId: string;
  paid: number;
  share: number;
  balance: number;
};

export type DetailedBalance = {
  userId: string;
  userEmail?: string;
  userName?: string;
  paid: number;
  share: number;
  balance: number;
  owes: Array<{ userId: string; userEmail?: string; userName?: string; amount: number }>;
  owesMoney: Array<{ userId: string; userEmail?: string; userName?: string; amount: number }>;
};

/**
 * Calcula los balances de los usuarios en un grupo.
 * - Busca los gastos de la colección `gastos` con `id_grupo` igual a groupId.
 * - Para cada gasto, intenta leer participaciones en `participaciones` (monto_asignado).
 *   Si hay participaciones, utiliza esos montos; si no, reparte el gasto igual entre los miembros del grupo (userGroups).
 */
export async function computeGroupBalances(groupId: string): Promise<Balance[]> {
  if (!collections.gastos) throw new Error("Colección 'gastos' no está inicializada");

  const gastos = (await collections.gastos.find({ id_grupo: groupId }).toArray()) as Array< Gasto & { _id?: ObjectId }>;

  // obtener miembros del grupo si es necesario (lazy)
  const getMembers = async (): Promise<string[]> => {
    if (!collections.userGroups) return [];
    const rows = (await collections.userGroups
      .find({ id_grupo: groupId })
      .project({ id_usuario: 1 })
      .toArray()) as Array<{ id_usuario: string | number }>;
    return rows.map((r) => String(r.id_usuario));
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
      // intentamos buscar participaciones por id_gasto (coincidiendo por ObjectId y por string)
  const gastoIdStr = String(g.id_gasto ?? g._id ?? "");
  const q = { id_gasto: gastoIdStr };
  const raw = (await collections.participaciones.find(q).toArray()) as Participacion[];
      parts = raw.map((p) => ({ id_usuario: String(p.id_usuario), monto_asignado: Number(p.monto_asignado) || 0 }));
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

/**
 * Calcula el balance detallado: quién debe dinero a quién.
 * Devuelve para cada usuario:
 * - owes: lista de usuarios a los que le debe dinero y cantidad
 * - owesMoney: lista de usuarios que le deben dinero a él y cantidad
 */
export async function computeDetailedBalances(groupId: string): Promise<DetailedBalance[]> {
  const balances = await computeGroupBalances(groupId);
  
  // Obtener información de usuarios
  const userMap: Record<string, { email?: string; name?: string }> = {};
  if (collections.users) {
    const users = await collections.users.find({}).toArray() as any[];
    for (const u of users) {
      userMap[String(u._id || u.id)] = { 
        email: u.email, 
        name: u.nombre || u.name 
      };
    }
  }

  // Crear un mapa de balances para cálculos de deudas
  const balanceMap: Record<string, number> = {};
  for (const b of balances) {
    balanceMap[b.userId] = b.balance;
  }

  // Calcular quien debe a quién
  const detailed: DetailedBalance[] = balances.map((b) => ({
    userId: b.userId,
    userEmail: userMap[b.userId]?.email,
    userName: userMap[b.userId]?.name,
    paid: b.paid,
    share: b.share,
    balance: b.balance,
    owes: [],
    owesMoney: [],
  }));

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
}
