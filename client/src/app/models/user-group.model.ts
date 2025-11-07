export interface UserGroup {
  _id?: string;
  id_usuario: string | number;
  id_grupo: string | number;
  rol: 'admin' | 'miembro';
  fecha_union: string | Date;
}
