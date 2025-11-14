import * as mongodb from "mongodb";

/**
 * Representa la participación de un usuario en un gasto compartido.
 * Campos:
 *  - id_participacion: UUID o INT opcional (identificador externo)
 *  - id_usuario: FK hacia usuario (id externo o string del ObjectId)
 *  - id_gasto: FK hacia gasto (id externo o string del ObjectId)
 *  - monto_contribuido: monto que el usuario ha contribuido a este gasto
 */
export interface Participacion {
  id_participacion?: string | number;
  id_usuario: string | number;
  id_gasto: string | number;
  monto_asignado: number;
  _id?: mongodb.ObjectId;
}

// Ejemplo de documento:
// {
//   "id_participacion": "c9d4f1e2-...",
//   "id_usuario": "5f8d0d55b54764421b7156c4",
//   "id_gasto": "d3e5f6a7-...",
//   "monto_asignado": 50.75
// }