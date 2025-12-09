import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";

export const groupInvitationsRouter = express.Router();

// Enviar invitación a un usuario para unirse a un grupo
groupInvitationsRouter.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const { id_grupo, id_invitado, id_invitador } = req.body || {};

    if (!id_grupo || !id_invitado || !id_invitador) {
      return res.status(400).send({ message: 'id_grupo, id_invitado e id_invitador son requeridos' });
    }

    // Verificar que el invitador sea owner o admin del grupo
    const inviter = await collections.userGroups!.findOne({ id_usuario: String(id_invitador), id_grupo: String(id_grupo) }) as any;
    if (!inviter || (inviter.rol !== 'owner' && inviter.rol !== 'admin')) {
      return res.status(403).send({ message: 'No autorizado para enviar invitaciones' });
    }

    // Verificar que el invitado no sea ya miembro
    const existingMembership = await collections.userGroups!.findOne({ id_usuario: String(id_invitado), id_grupo: String(id_grupo) });
    if (existingMembership) {
      return res.status(409).send({ message: 'El usuario ya es miembro del grupo' });
    }

    // Verificar que no exista una invitación pendiente
    const existingInvitation = await collections.groupInvitations!.findOne({ 
      id_grupo: String(id_grupo), 
      id_invitado: String(id_invitado),
      estado: 'pendiente'
    });
    if (existingInvitation) {
      return res.status(409).send({ message: 'Ya existe una invitación pendiente para este usuario' });
    }

    const invitation: any = {
      id_grupo: String(id_grupo),
      id_invitado: String(id_invitado),
      id_invitador: String(id_invitador),
      estado: 'pendiente',
      fecha_invitacion: new Date(),
    };

    const result = await collections.groupInvitations!.insertOne(invitation);
    if (result && result.insertedId) {
      return res.status(201).send({ message: 'Invitación enviada', id: result.insertedId });
    } else {
      return res.status(500).send({ message: 'No se pudo enviar la invitación' });
    }
  } catch (error: any) {
    console.error('send invitation error', error);
    return res.status(500).send({ message: 'Error al enviar la invitación', error });
  }
});

// Obtener invitaciones pendientes para un usuario
groupInvitationsRouter.get("/user/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.params.userId;
    const invitations = await collections.groupInvitations!.find({ 
      id_invitado: String(userId),
      estado: 'pendiente'
    }).toArray();

    // Enriquecer con datos del grupo e invitador
    const enriched = await Promise.all(invitations.map(async (inv: any) => {
      const group = await collections.sharedAccounts!.findOne({ _id: new ObjectId(inv.id_grupo) }).catch(() => null);
      const inviter = await collections.users!.findOne({ _id: new ObjectId(inv.id_invitador) }).catch(() => null);
      return {
        ...inv,
        grupo: group,
        invitador: inviter,
      };
    }));

    return res.status(200).send(enriched);
  } catch (error) {
    console.error('get user invitations error', error);
    return res.status(500).send({ message: 'Error al obtener invitaciones', error });
  }
});

// Aceptar invitación
groupInvitationsRouter.post("/:id/accept", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).send({ message: 'userId es requerido' });
    }

    const invitation = await collections.groupInvitations!.findOne({ _id: new ObjectId(id) }) as any;
    if (!invitation) {
      return res.status(404).send({ message: 'Invitación no encontrada' });
    }

    if (String(invitation.id_invitado) !== String(userId)) {
      return res.status(403).send({ message: 'No autorizado para aceptar esta invitación' });
    }

    if (invitation.estado !== 'pendiente') {
      return res.status(400).send({ message: 'La invitación ya fue respondida' });
    }

    // Verificar que no sea ya miembro (por si acaso)
    const existingMembership = await collections.userGroups!.findOne({ 
      id_usuario: String(userId), 
      id_grupo: String(invitation.id_grupo) 
    });
    if (existingMembership) {
      // Marcar la invitación como aceptada aunque ya sea miembro
      await collections.groupInvitations!.updateOne(
        { _id: new ObjectId(id) },
        { $set: { estado: 'aceptada', fecha_respuesta: new Date() } }
      );
      return res.status(200).send({ message: 'Ya eres miembro del grupo' });
    }

    // Crear membresía
    const membershipDoc: any = {
      id_usuario: String(userId),
      id_grupo: String(invitation.id_grupo),
      rol: 'miembro',
      fecha_union: new Date(),
    };
    await collections.userGroups!.insertOne(membershipDoc);

    // Actualizar estado de invitación
    await collections.groupInvitations!.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'aceptada', fecha_respuesta: new Date() } }
    );

    return res.status(200).send({ message: 'Invitación aceptada' });
  } catch (error) {
    console.error('accept invitation error', error);
    return res.status(500).send({ message: 'Error al aceptar la invitación', error });
  }
});

// Rechazar invitación
groupInvitationsRouter.post("/:id/reject", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).send({ message: 'userId es requerido' });
    }

    const invitation = await collections.groupInvitations!.findOne({ _id: new ObjectId(id) }) as any;
    if (!invitation) {
      return res.status(404).send({ message: 'Invitación no encontrada' });
    }

    if (String(invitation.id_invitado) !== String(userId)) {
      return res.status(403).send({ message: 'No autorizado para rechazar esta invitación' });
    }

    if (invitation.estado !== 'pendiente') {
      return res.status(400).send({ message: 'La invitación ya fue respondida' });
    }

    await collections.groupInvitations!.updateOne(
      { _id: new ObjectId(id) },
      { $set: { estado: 'rechazada', fecha_respuesta: new Date() } }
    );

    return res.status(200).send({ message: 'Invitación rechazada' });
  } catch (error) {
    console.error('reject invitation error', error);
    return res.status(500).send({ message: 'Error al rechazar la invitación', error });
  }
});
