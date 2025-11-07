export interface SharedAccount {
  _id?: string;
  id_grupo?: string | number;
  nombre: string;
  descripcion?: string | null;
  moneda: string;
  creador_id: string | number;
  fecha_creacion: string | Date;
}
