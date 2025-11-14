import * as mongodb from "mongodb";

export interface User {
    id_usuario?: string;
    nombre: string;
    email: string;
    password_hash: string;
    foto_perfil?: string;
    fecha_registro: Date;
    preferencia_tema: "claro" | "oscuro";
    _id?: mongodb.ObjectId;
}
