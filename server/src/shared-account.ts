import * as mongodb from "mongodb";

/**
 * Representa una cuenta/grupo compartido (por ejemplo: "Viaje a Roma").
 * Campos:
 *  - id_grupo: UUID o INT opcional (identificador externo)
 *  - nombre: nombre del grupo (obligatorio)
 *  - descripcion: descripción breve (opcional)
 *  - moneda: código ISO 4217 (ej. EUR, USD) - 3 caracteres
 *  - creador_id: id del usuario que creó el grupo (FK hacia Usuario)
 *  - fecha_creacion: fecha de creación
 */
export interface SharedAccount {
    // optional external id (UUID or INT)
    id_grupo?: string | number;

    // nombre del grupo
    nombre: string;

    // descripción breve
    descripcion?: string;

    // ISO 4217 currency code
    moneda: string;

    // referencia al usuario que creó el grupo (puede ser id externo o user._id en string)
    creador_id: string;

    // fecha de creación
    fecha_creacion: Date;

    // MongoDB internal id
    _id?: mongodb.ObjectId;
}

// Ejemplo de documento:
// {
//   "id_grupo": "b7f6e1a4-...",
//   "nombre": "Viaje a Roma",
//   "descripcion": "Gastos compartidos del viaje a Roma 2025",
//   "moneda": "EUR",
//   "creador_id": "5f8d0d55b54764421b7156c4",
//   "fecha_creacion": new Date()
// }
