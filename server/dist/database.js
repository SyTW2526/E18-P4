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
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new mongodb.MongoClient(uri);
        yield client.connect();
        const db = client.db("meanStackExample");
        yield applySchemaValidation(db);
        const usersCollection = db.collection("users");
        exports.collections.users = usersCollection;
        const sharedAccountsCollection = db.collection("shared_accounts");
        exports.collections.sharedAccounts = sharedAccountsCollection;
        const gastosCollection = db.collection("gastos");
        exports.collections.gastos = gastosCollection;
        const userGroupsCollection = db.collection("user_groups");
        exports.collections.userGroups = userGroupsCollection;
        const participacionesCollection = db.collection("participaciones");
        exports.collections.participaciones = participacionesCollection;
        try {
            yield ((_a = exports.collections.userGroups) === null || _a === void 0 ? void 0 : _a.createIndex({ id_usuario: 1, id_grupo: 1 }, { unique: true, background: true }));
        }
        catch (err) {
            console.warn("Could not create index on user_groups (id_usuario, id_grupo)", err);
        }
        try {
            yield ((_b = exports.collections.gastos) === null || _b === void 0 ? void 0 : _b.createIndex({ id_grupo: 1 }, { background: true }));
        }
        catch (err) {
            console.warn("Could not create index on gastos.id_grupo", err);
        }
        try {
            yield ((_c = exports.collections.participaciones) === null || _c === void 0 ? void 0 : _c.createIndex({ id_gasto: 1 }, { background: true }));
        }
        catch (err) {
            console.warn("Could not create index on participaciones.id_gasto", err);
        }
    });
}
exports.connectToDatabase = connectToDatabase;
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
        yield db.command({
            collMod: "gastos",
            validator: gastosJsonSchema,
        }).catch((error) => __awaiter(this, void 0, void 0, function* () {
            if (error.codeName === "NamespaceNotFound") {
                yield db.createCollection("gastos", { validator: gastosJsonSchema });
            }
        }));
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
        yield db.command({
            collMod: "user_groups",
            validator: userGroupsJsonSchema,
        }).catch((error) => __awaiter(this, void 0, void 0, function* () {
            if (error.codeName === "NamespaceNotFound") {
                yield db.createCollection("user_groups", { validator: userGroupsJsonSchema });
            }
        }));
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
        yield db.command({
            collMod: "participaciones",
            validator: participacionesJsonSchema,
        }).catch((error) => __awaiter(this, void 0, void 0, function* () {
            if (error.codeName === "NamespaceNotFound") {
                yield db.createCollection("participaciones", { validator: participacionesJsonSchema });
            }
        }));
    });
}
