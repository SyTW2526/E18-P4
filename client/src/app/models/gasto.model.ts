export interface Gasto {
  _id?: string;
  id_gasto?: string | number;
  id_grupo: string | number;
  descripcion: string;
  monto: number;
  id_pagador: string | number;
  fecha: string | Date;
  categoria: string;
}
