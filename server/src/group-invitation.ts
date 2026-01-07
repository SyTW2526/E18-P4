import * as mongodb from 'mongodb';

/**
 * Representa una invitación para unirse a un grupo.
 * Campos:
 *  - id_grupo: id del grupo (FK hacia SharedAccount)
 *  - id_invitado: id del usuario invitado (FK hacia Usuario)
 *  - id_invitador: id del usuario que envió la invitación (FK hacia Usuario)
 *  - estado: 'pendiente' | 'aceptada' | 'rechazada'
 *  - fecha_invitacion: fecha en que se envió la invitación
 *  - fecha_respuesta: fecha en que se respondió (opcional)
 */
export interface GroupInvitation {
  id_grupo: string;
  id_invitado: string;
  id_invitador: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_invitacion: Date;
  fecha_respuesta?: Date;
  _id?: mongodb.ObjectId;
}
