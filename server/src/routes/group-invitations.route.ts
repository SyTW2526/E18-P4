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
      tipo: 'directa',
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

// Generar enlace de invitación para un grupo
groupInvitationsRouter.post("/link/create", async (req: express.Request, res: express.Response) => {
  try {
    const { id_grupo, id_invitador, usos_maximos, dias_expiracion } = req.body || {};

    if (!id_grupo || !id_invitador) {
      return res.status(400).send({ message: 'id_grupo e id_invitador son requeridos' });
    }

    // Verificar que el invitador sea owner o admin del grupo
    const inviter = await collections.userGroups!.findOne({ 
      id_usuario: String(id_invitador), 
      id_grupo: String(id_grupo) 
    }) as any;
    
    if (!inviter || (inviter.rol !== 'owner' && inviter.rol !== 'admin')) {
      return res.status(403).send({ message: 'No autorizado para crear enlaces de invitación' });
    }

    // Generar token único
    const token = require('crypto').randomBytes(16).toString('hex');
    
    // Calcular fecha de expiración
    let expira_en = null;
    if (dias_expiracion && dias_expiracion > 0) {
      expira_en = new Date();
      expira_en.setDate(expira_en.getDate() + dias_expiracion);
    }

    const invitation: any = {
      id_grupo: String(id_grupo),
      id_invitado: null,  // Para enlaces, no hay invitado específico
      id_invitador: String(id_invitador),
      tipo: 'enlace',
      estado: 'pendiente',
      token: token,
      fecha_invitacion: new Date(),
      usos_maximos: usos_maximos || null,
      usos_actuales: 0,
      expira_en: expira_en,
    };

    const result = await collections.groupInvitations!.insertOne(invitation);
    if (result && result.insertedId) {
      return res.status(201).send({ 
        message: 'Enlace de invitación creado',
        invitationId: result.insertedId,
        token: token,
        enlace: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/join-group/${token}`
      });
    } else {
      return res.status(500).send({ message: 'No se pudo crear el enlace' });
    }
  } catch (error: any) {
    console.error('create invitation link error', error);
    return res.status(500).send({ message: 'Error al crear el enlace', error });
  }
});

// Validar y usar un enlace de invitación
groupInvitationsRouter.post("/link/:token/join", async (req: express.Request, res: express.Response) => {
  try {
    const token = req.params.token;
    const { userId } = req.body || {};

    if (!userId) {
      return res.status(400).send({ message: 'userId es requerido' });
    }

    // Buscar invitación por token
    const invitation = await collections.groupInvitations!.findOne({ 
      token: token,
      tipo: 'enlace',
      estado: 'pendiente'
    }) as any;

    if (!invitation) {
      return res.status(404).send({ message: 'Enlace inválido o expirado' });
    }

    // Verificar si ha expirado
    if (invitation.expira_en && new Date() > new Date(invitation.expira_en)) {
      return res.status(410).send({ message: 'Este enlace ha expirado' });
    }

    // Verificar usos máximos
    if (invitation.usos_maximos && invitation.usos_actuales >= invitation.usos_maximos) {
      return res.status(410).send({ message: 'Este enlace ha alcanzado el número máximo de usos' });
    }

    // Verificar que el usuario no sea ya miembro
    const existingMembership = await collections.userGroups!.findOne({ 
      id_usuario: String(userId), 
      id_grupo: String(invitation.id_grupo) 
    });
    
    if (existingMembership) {
      // Si ya es miembro, devolver éxito con el id del grupo
      return res.status(200).send({ 
        message: 'Ya eres miembro de este grupo',
        id_grupo: invitation.id_grupo,
        alreadyMember: true
      });
    }

    // Agregar usuario al grupo como miembro
    const newMembership: any = {
      id_usuario: String(userId),
      id_grupo: String(invitation.id_grupo),
      rol: 'miembro',
      fecha_union: new Date(),
    };

    await collections.userGroups!.insertOne(newMembership);

    // Incrementar contador de usos
    await collections.groupInvitations!.updateOne(
      { _id: invitation._id },
      { 
        $inc: { usos_actuales: 1 },
        $set: { fecha_respuesta: new Date() }
      }
    );

    return res.status(200).send({ 
      message: 'Te has unido al grupo exitosamente',
      id_grupo: invitation.id_grupo
    });
  } catch (error: any) {
    console.error('join with link error', error);
    return res.status(500).send({ message: 'Error al unirse al grupo', error });
  }
});

// Obtener enlaces activos de un grupo
groupInvitationsRouter.get("/group/:groupId/links", async (req: express.Request, res: express.Response) => {
  try {
    const groupId = req.params.groupId;
    const { id_invitador } = req.query;

    // Verificar permisos
    if (id_invitador) {
      const inviter = await collections.userGroups!.findOne({ 
        id_usuario: String(id_invitador), 
        id_grupo: String(groupId) 
      }) as any;
      
      if (!inviter || (inviter.rol !== 'owner' && inviter.rol !== 'admin')) {
        return res.status(403).send({ message: 'No autorizado' });
      }
    }

    const links = await collections.groupInvitations!.find({
      id_grupo: String(groupId),
      tipo: 'enlace',
      estado: 'pendiente'
    }).toArray();

    // Filtrar los que han expirado
    const activeLinks = links.filter((link: any) => {
      if (link.expira_en && new Date() > new Date(link.expira_en)) {
        return false;
      }
      if (link.usos_maximos && link.usos_actuales >= link.usos_maximos) {
        return false;
      }
      return true;
    });

    return res.status(200).send(activeLinks);
  } catch (error) {
    console.error('get group links error', error);
    return res.status(500).send({ message: 'Error al obtener enlaces', error });
  }
});

// Revocar un enlace de invitación
groupInvitationsRouter.post("/link/:linkId/revoke", async (req: express.Request, res: express.Response) => {
  try {
    const linkId = req.params.linkId;
    const { id_usuario } = req.body || {};

    if (!id_usuario) {
      return res.status(400).send({ message: 'id_usuario es requerido' });
    }

    const link = await collections.groupInvitations!.findOne({ _id: new ObjectId(linkId) }) as any;
    if (!link) {
      return res.status(404).send({ message: 'Enlace no encontrado' });
    }

    // Verificar permisos
    const user = await collections.userGroups!.findOne({ 
      id_usuario: String(id_usuario), 
      id_grupo: String(link.id_grupo) 
    }) as any;
    
    if (!user || (user.rol !== 'owner' && user.rol !== 'admin')) {
      return res.status(403).send({ message: 'No autorizado' });
    }

    // Revocar el enlace
    await collections.groupInvitations!.updateOne(
      { _id: new ObjectId(linkId) },
      { $set: { estado: 'rechazada', fecha_respuesta: new Date() } }
    );

    return res.status(200).send({ message: 'Enlace revocado exitosamente' });
  } catch (error: any) {
    console.error('revoke link error', error);
    return res.status(500).send({ message: 'Error al revocar el enlace', error });
  }
});
