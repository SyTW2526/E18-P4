import * as mongodb from "mongodb";
import { ObjectId } from "mongodb";

export interface Notification {
  _id?: ObjectId;
  tipo: 'solicitud_pago' | 'pago_confirmado' | 'gasto_creado' | 'grupo_invitacion' | 'solicitud_amistad';
  de_usuario: ObjectId; // quien envia la notificacion
  para_usuario: ObjectId; // quien recibe la notificacion
  id_grupo?: ObjectId; // opcional para solicitudes de amistad
  monto?: number; // para solicitudes de pago
  id_gasto?: ObjectId; // referencia opcional al gasto
  mensaje?: string;
  leida: boolean;
  respondida?: boolean; // para solicitudes que requieren accion
  fecha: Date;
}

export const notificationsCollection = (db: mongodb.Db) => {
  return db.collection<Notification>("notifications");
};
