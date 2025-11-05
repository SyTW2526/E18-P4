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
exports.userGroupRouter = void 0;
const express = __importStar(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("../database");
exports.userGroupRouter = express.Router();
// Obtener todas las cuentas/grupos compartidos
exports.userGroupRouter.get("/shared-accounts", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sharedAccounts = yield database_1.collections.sharedAccounts.find({}).toArray();
        res.status(200).json(sharedAccounts);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener las cuentas compartidas.", error });
    }
}));
// Obtener una cuenta/grupo compartido por su ID de MongoDB
exports.userGroupRouter.get("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const item = yield database_1.collections.sharedAccounts.findOne(query);
        if (item) {
            res.status(200).send(item);
        }
        else {
            res.status(404).send({ message: "Cuenta compartida no encontrada." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al obtener la cuenta compartida.", error });
    }
}));
// Crear una nueva cuenta/grupo compartido
exports.userGroupRouter.post("/shared-accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cuenta = req.body;
        // asegurar que la fecha de creación sea un objeto Date
        if (!cuenta.fecha_creacion) {
            cuenta.fecha_creacion = new Date();
        }
        else {
            cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
        }
        if (cuenta.moneda && typeof cuenta.moneda === "string") {
            cuenta.moneda = cuenta.moneda.toUpperCase();
        }
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.insertOne(cuenta));
        result
            ? res.status(201).send({ message: "Cuenta compartida creada.", id: result.insertedId })
            : res.status(500).send({ message: "Error al crear la cuenta compartida." });
    }
    catch (error) {
        res.status(400).send({ message: "Error al crear la cuenta compartida.", error });
    }
}));
// Actualizar cuenta/grupo compartido
exports.userGroupRouter.put("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const cuenta = req.body;
        // asegurar que la fecha de creación sea un objeto Date si se proporciona
        if (cuenta.fecha_creacion) {
            cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
        }
        if (cuenta.moneda && typeof cuenta.moneda === "string") {
            cuenta.moneda = cuenta.moneda.toUpperCase();
        }
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.updateOne(query, { $set: cuenta }));
        if (result === null || result === void 0 ? void 0 : result.acknowledged) {
            res.status(201).send(`Created a new shared account: ID ${result.upsertedId}.`);
        }
        else {
            res.status(500).send("Failed to create a new shared account.");
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// Eliminar cuenta/grupo compartido
exports.userGroupRouter.delete("/shared-accounts/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.sharedAccounts.deleteOne(query));
        if (result && result.deletedCount) {
            res.status(202).send({ message: "Cuenta compartida eliminada." });
        }
        else {
            res.status(404).send({ message: "Cuenta compartida no encontrada." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al eliminar la cuenta compartida.", error });
    }
}));
