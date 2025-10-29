"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = exports.collections = void 0;
const mongodb = __importStar(require("mongodb"));
exports.collections = {};
function connectToDatabase(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongodb.MongoClient(uri);
        yield client.connect();
        const db = client.db("meanStackExample");
        yield applySchemaValidation(db);
        const usersCollection = db.collection("users");
        exports.collections.users = usersCollection;
        const sharedAccountsCollection = db.collection("shared_accounts");
        exports.collections.sharedAccounts = sharedAccountsCollection;
    });
}
exports.connectToDatabase = connectToDatabase;
// Update our existing collection with JSON schema validation so we know our documents will always match the shape of our Employee model, even if added elsewhere.
// For more information about schema validation, see this blog series: https://www.mongodb.com/blog/post/json-schema-validation--locking-down-your-model-the-smart-way
function applySchemaValidation(db) {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield db.command({
            collMod: "users",
            validator: jsonSchema
        }).catch((error) => __awaiter(this, void 0, void 0, function* () {
            if (error.codeName === "NamespaceNotFound") {
                yield db.createCollection("users", { validator: jsonSchema });
            }
        }));
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
        yield db.command({
            collMod: "shared_accounts",
            validator: sharedAccountsJsonSchema,
        }).catch((error) => __awaiter(this, void 0, void 0, function* () {
            if (error.codeName === "NamespaceNotFound") {
                yield db.createCollection("shared_accounts", { validator: sharedAccountsJsonSchema });
            }
        }));
    });
}
