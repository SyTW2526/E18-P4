import * as mongodb from "mongodb";

// User model matching the provided schema
export interface User {
    // optional external id (UUID or INT) if you need to keep one alongside Mongo _id
    id_usuario?: string;
    nombre: string;
    email: string;
    // the hashed password (the field name indicates it should already be hashed)
    password_hash: string;
    // optional URL to profile picture
    foto_perfil?: string;
    // registration date
    fecha_registro: Date;
    // theme preference: 'claro' or 'oscuro'
    preferencia_tema: "claro" | "oscuro";
    _id?: mongodb.ObjectId;
}
