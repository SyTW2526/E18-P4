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
}
