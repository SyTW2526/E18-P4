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
  id_invitado?: string;  // Opcional para invitaciones por enlace
  id_invitador: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_invitacion: Date;
  fecha_respuesta?: Date;
  // Campos para invitación por enlace
  token?: string;         // Token único para invitación por enlace
  tipo: 'personal' | 'enlace'; // Tipo de invitación
  usos_maximos?: number;  // Número máximo de usos del enlace (null = ilimitado)
  usos_actuales?: number; // Usos actuales del enlace
  expira_en?: Date;       // Fecha de expiración del enlace
  _id?: mongodb.ObjectId;
}
