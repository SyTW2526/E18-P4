export interface Participacion {
  _id?: string;
  id_participacion?: string | number;
  id_usuario: string | number;
  id_gasto: string | number;
  monto_asignado: number;
}
