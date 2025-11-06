import * as mongodb from "mongodb";
import { User } from "./users";
import { SharedAccount } from "./shared-account";
import { UserGroup } from "./user-group";
import { Gasto } from "./gastos";
import { Participacion } from "./participacion";


export const collections: {
  users?: mongodb.Collection<User>;
  sharedAccounts?: mongodb.Collection<SharedAccount>;
  gastos?: mongodb.Collection<Gasto>;
  userGroups?: mongodb.Collection<UserGroup>;
  participaciones?: mongodb.Collection<Participacion>;
} = {};

export async function connectToDatabase(uri: string) {
  const client = new mongodb.MongoClient(uri);
  await client.connect();

  const db = client.db("meanStackExample");
  await applySchemaValidation(db);

  const usersCollection = db.collection<User>("users");
  collections.users = usersCollection;
  const sharedAccountsCollection = db.collection<SharedAccount>("shared_accounts");
  collections.sharedAccounts = sharedAccountsCollection;
  const gastosCollection = db.collection<Gasto>("gastos");
  collections.gastos = gastosCollection;
  const userGroupsCollection = db.collection<UserGroup>("user_groups");
  collections.userGroups = userGroupsCollection;
  const participacionesCollection = db.collection<Participacion>("participaciones");
  collections.participaciones = participacionesCollection;


    try {
        await collections.userGroups?.createIndex({ id_usuario: 1, id_grupo: 1 }, { unique: true, background: true });
    } catch (err) {
        console.warn("Could not create index on user_groups (id_usuario, id_grupo)", err);
    }

    try {
        await collections.gastos?.createIndex({ id_grupo: 1 }, { background: true });
    } catch (err) {
        console.warn("Could not create index on gastos.id_grupo", err);
    }

    try {
        await collections.participaciones?.createIndex({ id_gasto: 1 }, { background: true });
    } catch (err) {
        console.warn("Could not create index on participaciones.id_gasto", err);
    }
}

async function applySchemaValidation(db: mongodb.Db) {
    const jsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "email", "password_hash", "fecha_registro", "preferencia_tema"],
            additionalProperties: false,
            properties: {
                _id: {},
                id_usuario: {
                    bsonType: ["string", "int"],
                    description: "Optional external id (UUID or INT)",
                },
                nombre: {
                    bsonType: "string",
                    description: "'nombre' is required and is a string",
                },
                email: {
                    bsonType: "string",
                    description: "'email' is required and is a string",
                },
                password_hash: {
                    bsonType: "string",
                    description: "'password_hash' is required and is a string",
                },
                foto_perfil: {
                    bsonType: ["string", "null"],
                    description: "Optional URL to profile picture",
                },
                fecha_registro: {
                    bsonType: "date",
                    description: "'fecha_registro' is required and is a date",
                },
                preferencia_tema: {
                    bsonType: "string",
                    description: "'preferencia_tema' is required and is either 'claro' or 'oscuro'",
                    enum: ["claro", "oscuro"],
                },
            },
        },
    };

    await db.command({
        collMod: "users",
        validator: jsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("users", {validator: jsonSchema});
        }
    });

    const sharedAccountsJsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["nombre", "moneda", "creador_id", "fecha_creacion"],
            additionalProperties: false,
            properties: {
                _id: {},
                id_grupo: {
                    bsonType: ["string", "int"],
                    description: "Optional external id (UUID or INT)",
                },
                nombre: {
                    bsonType: "string",
                    description: "'nombre' is required and is a string",
                },
                descripcion: {
                    bsonType: ["string", "null"],
                    description: "Optional description",
                },
                moneda: {
                    bsonType: "string",
                    description: "3-letter ISO currency code",
                },
                creador_id: {
                    bsonType: "string",
                    description: "Reference to the creator user id",
                },
                fecha_creacion: {
                    bsonType: "date",
                    description: "'fecha_creacion' is required and is a date",
                },
            },
        },
    };

    await db.command({
        collMod: "shared_accounts",
        validator: sharedAccountsJsonSchema,
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("shared_accounts", { validator: sharedAccountsJsonSchema });
        }
    });

    // Schema validation for gastos
    const gastosJsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["id_grupo", "descripcion", "monto", "id_pagador", "fecha", "categoria"],
            additionalProperties: false,
            properties: {
                _id: {},
                id_gasto: {
                    bsonType: ["string", "int"],
                    description: "Optional external id (UUID or INT)",
                },
                id_grupo: {
                    bsonType: ["string", "int"],
                    description: "Reference to group id",
                },
                descripcion: {
                    bsonType: "string",
                    description: "Expense description",
                },
                monto: {
                    bsonType: ["double", "int", "decimal"],
                    description: "Amount of the expense",
                },
                id_pagador: {
                    bsonType: ["string", "int"],
                    description: "Payer user id",
                },
                fecha: {
                    bsonType: "date",
                    description: "Date of the expense",
                },
                categoria: {
                    bsonType: "string",
                    description: "Category of the expense",
                },
            },
        },
    };

    await db.command({
        collMod: "gastos",
        validator: gastosJsonSchema,
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("gastos", { validator: gastosJsonSchema });
        }
    });

    // Schema validation for user_groups (relations)
    const userGroupsJsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["id_usuario", "id_grupo", "rol", "fecha_union"],
            additionalProperties: false,
            properties: {
                _id: {},
                id_usuario: {
                    bsonType: ["string", "int"],
                    description: "Reference to user id",
                },
                id_grupo: {
                    bsonType: ["string", "int"],
                    description: "Reference to group id",
                },
                rol: {
                    bsonType: "string",
                    enum: ["admin", "miembro"],
                    description: "Role of the user in the group",
                },
                fecha_union: {
                    bsonType: "date",
                    description: "Date when joined",
                },
            },
        },
    };

    await db.command({
        collMod: "user_groups",
        validator: userGroupsJsonSchema,
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("user_groups", { validator: userGroupsJsonSchema });
        }
    });

    // Schema validation for participaciones
    const participacionesJsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["id_usuario", "id_gasto", "monto_asignado"],
            additionalProperties: false,
            properties: {
                _id: {},
                id_participacion: {
                    bsonType: ["string", "int"],
                    description: "Optional external id",
                },
                id_usuario: {
                    bsonType: ["string", "int"],
                    description: "Reference to user id",
                },
                id_gasto: {
                    bsonType: ["string", "int"],
                    description: "Reference to gasto id",
                },
                monto_asignado: {
                    bsonType: ["double", "int", "decimal"],
                    description: "Assigned amount for this participant",
                },
            },
        },
    };

    await db.command({
        collMod: "participaciones",
        validator: participacionesJsonSchema,
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("participaciones", { validator: participacionesJsonSchema });
        }
    });
}
