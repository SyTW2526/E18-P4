import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { computeGroupBalances } from "../balances";

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
    // buscar en user_groups por id_grupo
    const rows = await collections.userGroups!.find({ id_grupo: String(id) }).toArray();
    const userIds = rows.map(r => String((r as any).id_usuario));
    // traer usuarios
    const users = await collections.users!.find({ $or: userIds.map(u => ({ _id: new ObjectId(u) })) }).toArray().catch(() => []);
    // fallback: if users array empty, try to return minimal objects from ids
    if (!users || users.length === 0) {
      const minimal = userIds.map(u => ({ _id: u }));
      return res.status(200).send(minimal);
    }
    res.status(200).send(users);
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
            rol: 'admin',
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

    if (result?.acknowledged) {
      res.status(201).send(`Created a new shared account: ID ${result.upsertedId}.`);
    } else {
      res.status(500).send("Failed to create a new shared account.");
    }
  } catch (error) {
    console.error(error);
    res.status(400).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// Eliminar cuenta/grupo compartido
userGroupRouter.delete("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.deleteOne(query);
    
    if (result && result.deletedCount) {
      res.status(202).send({ message: "Cuenta compartida eliminada." });
    } else {
      res.status(404).send({ message: "Cuenta compartida no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al eliminar la cuenta compartida.", error });
  }
});
