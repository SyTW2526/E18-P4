import * as mongodb from 'mongodb';

/**
 * Representa un gasto dentro de una cuenta/grupo compartido.
 * Campos:
 *  - id_gasto: UUID o INT opcional (identificador externo)
 *  - id_grupo: FK hacia SharedAccount (id externo o string del ObjectId)
 *  - descripcion: descripción del gasto
 *  - monto: monto total del gasto
 *  - id_pagador: FK hacia usuario que pagó el gasto (id externo o string del ObjectId)
 *  - fecha: fecha del gasto
 *  - categoria: categoría del gasto (ej. comida, transporte, alojamiento, etc.)
 */

export interface Gasto {
  id_gasto: mongodb.ObjectId;
  id_grupo: string;
  descripcion: string;
  monto: number;
  id_pagador: string;
  fecha: Date;
  categoria: string;
}
