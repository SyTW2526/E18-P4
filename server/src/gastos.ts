import * as mongodb from 'mongodb';

/** 
 * 
 */

export interface Gasto {
  id_gasto?: mongodb.ObjectId;
  id_grupo: string;
  descripcion: string;
  monto: number;
  id_pagador: string;
  fecha: Date;
  categoria: string;
}
