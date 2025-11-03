import * as mongodb from 'mongodb';

/**
 * Campos:
 *  - id_usuario_grupo: UUID o INT opcional
 *  - id_usuario: FK hacia usuario (id externo o string del ObjectId)
 *  - id_grupo: FK hacia grupo/SharedAccount (id externo o string del ObjectId)
 *  - rol: 'admin' | 'miembro'
 *  - fecha_union: fecha en que el usuario se unió al grupo
 */
export interface UserGroup {
  id_usuario_grupo?: string | number;
  id_usuario: string | number;
  id_grupo: string | number;
  rol: 'admin' | 'miembro';
  fecha_union: Date;
  _id?: mongodb.ObjectId;
}

// Ejemplo de documento:
// {
//   "id_usuario_grupo": "a1b2c3d4-...",
//   "id_usuario": "5f8d0d55b54764421b7156c4",
//   "id_grupo": "b7f6e1a4-...",
//   "rol": "admin",
//   "fecha_union": new Date()
// }