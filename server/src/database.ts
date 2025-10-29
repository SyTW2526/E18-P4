import * as mongodb from "mongodb";
import { User } from "./users";

export const collections: {
    users?: mongodb.Collection<User>;
} = {};

export async function connectToDatabase(uri: string) {
    const client = new mongodb.MongoClient(uri);
    await client.connect();

    const db = client.db("meanStackExample");
    await applySchemaValidation(db);

    const usersCollection = db.collection<User>("users");
    collections.users = usersCollection;
}

// Update our existing collection with JSON schema validation so we know our documents will always match the shape of our Employee model, even if added elsewhere.
// For more information about schema validation, see this blog series: https://www.mongodb.com/blog/post/json-schema-validation--locking-down-your-model-the-smart-way
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

    // Try applying the modification to the collection, if the collection doesn't exist, create it
    await db.command({
        collMod: "users",
        validator: jsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("users", {validator: jsonSchema});
        }
    });
}
