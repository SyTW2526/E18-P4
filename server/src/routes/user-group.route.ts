import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { computeGroupBalances, computeDetailedBalances } from "../balances";

export const userGroupRouter = express.Router();

// Obtener todas las cuentas/grupos compartidos
userGroupRouter.get("/shared-accounts", async (_req: express.Request, res: express.Response) => {
  try {
    const sharedAccounts = await collections.sharedAccounts!.find({}).toArray();
    res.status(200).json(sharedAccounts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cuentas compartidas.", error });
  }
});

// Obtener una cuenta/grupo compartido por su ID de MongoDB
userGroupRouter.get("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const item = await collections.sharedAccounts!.findOne(query);
    if (item) {
      res.status(200).send(item);
    } else {
      res.status(404).send({ message: "Cuenta compartida no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al obtener la cuenta compartida.", error });
  }
});

// Obtener miembros (usuarios) de una cuenta compartida usando user_groups
userGroupRouter.get("/shared-accounts/:id/members", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const rows = await collections.userGroups!.find({ id_grupo: String(id) }).toArray();
    const userIds = rows.map(r => String((r as any).id_usuario));
    const rolesByUser: Record<string, string> = {};
    rows.forEach(r => { rolesByUser[String((r as any).id_usuario)] = (r as any).rol; });

    const users = await collections.users!.find({ $or: userIds.map(u => ({ _id: new ObjectId(u) })) }).toArray().catch(() => []);
    if (!users || users.length === 0) {
      const minimal = userIds.map(u => ({ _id: u, rol: rolesByUser[u] || 'miembro' }));
      return res.status(200).send(minimal);
    }

    const enriched = users.map(u => ({ ...u, rol: rolesByUser[String(u._id)] || 'miembro' }));
    res.status(200).send(enriched);
  } catch (error) {
    console.error('members fetch error', error);
    res.status(500).send({ message: 'Error al obtener miembros del grupo', error });
  }
});

// Obtener los grupos a los que pertenece un usuario (devuelve documentos de sharedAccounts)
userGroupRouter.get('/user-groups/user/:id', async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    // buscar relaciones user_groups por id_usuario
    const rows = await collections.userGroups!.find({ id_usuario: String(id) }).toArray();
    if (!rows || rows.length === 0) return res.status(200).json([]);
    // extraer ids de grupo válidos (24-char hex)
    const grupoIds = rows.map(r => String((r as any).id_grupo)).filter((g: string) => typeof g === 'string' && g.match(/^[0-9a-fA-F]{24}$/));
    if (!grupoIds.length) {
      // fallback: return minimal objects with ids when they are not ObjectId strings
      return res.status(200).json(rows.map(r => ({ id: (r as any).id_grupo })));
    }
    const objectIds = grupoIds.map((g: string) => new ObjectId(g));
    const groups = await collections.sharedAccounts!.find({ _id: { $in: objectIds } }).toArray();
    return res.status(200).json(groups);
  } catch (error) {
    console.error('user-groups by user fetch error', error);
    return res.status(500).json({ message: 'Error al obtener grupos del usuario', error });
  }
});

// Obtener balances calculados para una cuenta/grupo compartido
userGroupRouter.get("/shared-accounts/:id/balances", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const balances = await computeGroupBalances(id);
    // intentar enriquecer con datos de usuario (nombre/email)
    const userIds = balances.map(b => String(b.userId));
    const users = await collections.users!.find({ $or: userIds.map(u => ({ _id: new ObjectId(u) })) }).toArray().catch(() => []);
    const usersById: Record<string, any> = {};
    users.forEach(u => { usersById[String(u._id)] = u; });
    const result = balances.map(b => ({ ...b, user: usersById[b.userId] || { _id: b.userId } }));
    res.status(200).json(result);
  } catch (error) {
    console.error('balances fetch error', error);
    res.status(500).send({ message: 'Error al calcular balances', error: error instanceof Error ? error.message : error });
  }
});

// Obtener balances detallados (quién debe a quién)
userGroupRouter.get("/shared-accounts/:id/balances-detailed", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const detailedBalances = await computeDetailedBalances(id);
    res.status(200).json(detailedBalances);
  } catch (error) {
    console.error('detailed balances fetch error', error);
    res.status(500).send({ message: 'Error al calcular balances detallados', error: error instanceof Error ? error.message : error });
  }
});

// Crear una nueva cuenta/grupo compartido
userGroupRouter.post("/shared-accounts", async (req: express.Request, res: express.Response) => {
  try {
    const cuenta = req.body;
    // asegurar que la fecha de creación sea un objeto Date
    if(!cuenta.fecha_creacion) {
      cuenta.fecha_creacion = new Date();
    } else {
      cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
    }

    if(cuenta.moneda && typeof cuenta.moneda === "string") {
      cuenta.moneda = cuenta.moneda.toUpperCase();
    }

    const result = await collections?.sharedAccounts!.insertOne(cuenta);
    if (result && result.insertedId) {
      // If payload included a creator, auto-create a user_groups relation so the
      // creator is immediately a member/admin of the group and it will appear
      // in their "my groups" list.
      let creatorMembershipId: any = null;
      try {
        if (cuenta.creador_id) {
          const membershipDoc: any = {
            id_usuario: String(cuenta.creador_id),
            id_grupo: String(result.insertedId),
            rol: 'owner',
            fecha_union: new Date(),
          };
          const mres = await collections.userGroups!.insertOne(membershipDoc);
          if (mres && mres.insertedId) creatorMembershipId = String(mres.insertedId);
        }
      } catch (e) {
        // Log and continue: group was created, but auto-join failed.
        console.error('Failed to create creator membership for new group', e);
      }

      return res.status(201).send({ message: 'Cuenta compartida creada.', id: result.insertedId, creatorMembershipId });
    } else {
      return res.status(500).send({ message: 'Error al crear la cuenta compartida.' });
    }
  }
  catch (error) {
    console.error('POST /shared-accounts error', error);
    // Return more useful error information when possible
    const errMsg = error instanceof Error ? error.message : JSON.stringify(error);
    const errInfo: any = {};
    try {
      // try to pull common properties from MongoServerError-like objects
      errInfo.name = (error as any)?.name;
      errInfo.code = (error as any)?.code;
      errInfo.errInfo = (error as any)?.errInfo;
    } catch (e) {}
    res.status(400).send({ message: "Error al crear la cuenta compartida.", error: { message: errMsg, ...errInfo } });
  }
});

// Crear relación usuario-grupo (unirse a un grupo) usando la colección user_groups
userGroupRouter.post("/user-groups", async (req: express.Request, res: express.Response) => {
  try {
    const body = req.body || {};
    const id_usuario = body.id_usuario;
    const id_grupo = body.id_grupo;
    const rol = body.rol || 'miembro';

    if (!id_usuario || !id_grupo) {
      return res.status(400).send({ message: 'id_usuario y id_grupo son requeridos' });
    }

    const doc: any = {
      id_usuario: String(id_usuario),
      id_grupo: String(id_grupo),
      rol: String(rol),
      fecha_union: new Date(),
    };

    const result = await collections.userGroups!.insertOne(doc);
    if (result && result.insertedId) {
      res.status(201).send({ message: 'Usuario unido al grupo', id: result.insertedId });
    } else {
      res.status(500).send({ message: 'No se pudo crear la relación usuario-grupo' });
    }
  } catch (error: any) {
    // duplicate key (already a member)
    if (error?.code === 11000) {
      return res.status(409).send({ message: 'El usuario ya forma parte del grupo' });
    }
    console.error('user-groups POST error', error);
    res.status(500).send({ message: 'Error al unir al usuario al grupo', error });
  }
});

// Actualizar rol de un miembro (solo owner)
userGroupRouter.put('/user-groups/:groupId/role', async (req: express.Request, res: express.Response) => {
  try {
    const groupId = req.params.groupId;
    const { requesterId, targetUserId, role } = req.body || {};

    if (!requesterId || !targetUserId || !role) {
      return res.status(400).send({ message: 'requesterId, targetUserId y role son requeridos' });
    }

    if (!['admin', 'miembro'].includes(role as any)) {
      return res.status(400).send({ message: 'role debe ser admin o miembro' });
    }

    const requester = await collections.userGroups!.findOne({ id_usuario: String(requesterId), id_grupo: String(groupId) }) as any;
    if (!requester || requester.rol !== 'owner') {
      return res.status(403).send({ message: 'Solo el owner puede cambiar roles' });
    }

    const target = await collections.userGroups!.findOne({ id_usuario: String(targetUserId), id_grupo: String(groupId) }) as any;
    if (!target) {
      return res.status(404).send({ message: 'Miembro no encontrado en el grupo' });
    }

    if (target.rol === 'owner') {
      return res.status(400).send({ message: 'No se puede modificar el rol del owner' });
    }

    await collections.userGroups!.updateOne({ _id: target._id }, { $set: { rol: role as 'admin' | 'miembro' } });
    return res.status(200).send({ message: 'Rol actualizado' });
  } catch (error) {
    console.error('update role error', error);
    return res.status(500).send({ message: 'Error al actualizar el rol', error });
  }
});

// Expulsar miembro (owner o admin). Admin solo puede expulsar miembros.
userGroupRouter.delete('/user-groups', async (req: express.Request, res: express.Response) => {
  try {
    const { requesterId, targetUserId, groupId } = req.body || {};

    if (!requesterId || !targetUserId || !groupId) {
      return res.status(400).send({ message: 'requesterId, targetUserId y groupId son requeridos' });
    }

    const requester = await collections.userGroups!.findOne({ id_usuario: String(requesterId), id_grupo: String(groupId) });
    if (!requester || (requester.rol !== 'owner' && requester.rol !== 'admin')) {
      return res.status(403).send({ message: 'No autorizado para expulsar miembros' });
    }

    const target = await collections.userGroups!.findOne({ id_usuario: String(targetUserId), id_grupo: String(groupId) });
    if (!target) {
      return res.status(404).send({ message: 'Miembro no encontrado en el grupo' });
    }

    if (target.rol === 'owner') {
      return res.status(400).send({ message: 'No se puede expulsar al owner' });
    }

    if (requester.rol === 'admin' && target.rol !== 'miembro') {
      return res.status(403).send({ message: 'Los admins solo pueden expulsar miembros' });
    }

    await collections.userGroups!.deleteOne({ _id: target._id });
    return res.status(200).send({ message: 'Miembro expulsado' });
  } catch (error) {
    console.error('remove member error', error);
    return res.status(500).send({ message: 'Error al expulsar al miembro', error });
  }
});

// Actualizar cuenta/grupo compartido
userGroupRouter.put("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const cuenta = req.body;

    // asegurar que la fecha de creación sea un objeto Date si se proporciona
    if(cuenta.fecha_creacion) {
      cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
    }

    if(cuenta.moneda && typeof cuenta.moneda === "string") {
      cuenta.moneda = cuenta.moneda.toUpperCase();
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.updateOne(query, { $set: cuenta });

    if (result && result.matchedCount) {
      return res.status(200).json({ id, message: 'Cuenta compartida actualizada.' });
    }
    if (!result?.matchedCount) {
      return res.status(404).json({ message: `No se encontro la cuenta compartida: ID ${id}` });
    }
    return res.status(304).json({ message: `Sin cambios para la cuenta: ID ${id}` });
  } catch (error) {
    console.error('Shared account update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const details: any = (error as any)?.errInfo || (error as any)?.errorResponse || error;
    res.status(400).json({ message, details });
  }
});

// Eliminar cuenta/grupo compartido (solo owner)
userGroupRouter.delete("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { requesterId } = req.body || {};

    if (!requesterId) {
      return res.status(400).send({ message: 'requesterId es requerido' });
    }

    // Check if requester is owner of the group
    const requester = await collections.userGroups!.findOne({ id_usuario: String(requesterId), id_grupo: String(id) }) as any;
    if (!requester || requester.rol !== 'owner') {
      return res.status(403).send({ message: 'Solo el owner puede eliminar el grupo' });
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.deleteOne(query);
    
    if (result && result.deletedCount) {
      // Also delete all user_groups relations for this group
      await collections.userGroups!.deleteMany({ id_grupo: String(id) }).catch(err => console.error('Failed to clean up user_groups', err));
      res.status(202).send({ message: "Cuenta compartida eliminada." });
    } else {
      res.status(404).send({ message: "Cuenta compartida no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al eliminar la cuenta compartida.", error });
  }
});
