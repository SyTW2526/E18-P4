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
exports.participacionRouter = void 0;
const express = __importStar(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
exports.participacionRouter = express.Router();
// Obtener todas las participaciones
exports.participacionRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const participaciones = yield database_1.collections.participaciones.find({}).toArray();
        res.status(200).json(participaciones);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener las participaciones.", error });
    }
}));
// Obtener una participacion por su ID de MongoDB
exports.participacionRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const item = yield database_1.collections.participaciones.findOne(query);
        if (item) {
            res.status(200).send(item);
        }
        else {
            res.status(404).send({ message: "Participacion no encontrada." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al obtener la participacion.", error });
    }
}));
// Crear una nueva participacion 
exports.participacionRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const participacion = req.body;
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.participaciones.insertOne(participacion));
        result
            ? res.status(201).send({ message: "Participacion creada.", id: result.insertedId })
            : res.status(500).send({ message: "Error al crear la participacion." });
    }
    catch (error) {
        res.status(400).send({ message: "Error al crear la participacion.", error });
    }
}));
// Actualizar participacion
exports.participacionRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const participacion = req.body;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield (database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.participaciones.updateOne(query, { $set: participacion }));
        if (result === null || result === void 0 ? void 0 : result.acknowledged) {
            res.status(201).send(`Created a new participacion: ID ${result.upsertedId}.`);
        }
        else {
            res.status(500).send("Failed to create a new participacion.");
        }
    }
    catch (error) {
        res.status(400).send({ message: "Error al actualizar la participacion.", error });
    }
}));
// Eliminar una participacion por su ID de MongoDB
exports.participacionRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield database_1.collections.participaciones.deleteOne(query);
        result.deletedCount
            ? res.status(200).send({ message: "Participacion eliminada." })
            : res.status(404).send({ message: "Participacion no encontrada." });
    }
    catch (error) {
        res.status(500).send({ message: "Error al eliminar la participacion.", error });
    }
}));
// Obtener participaciones por id_gasto
exports.participacionRouter.get("/gasto/:id_gasto", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id_gasto = req.params.id_gasto;
        const query = { id_gasto: id_gasto };
        const participaciones = yield database_1.collections.participaciones.find(query).toArray();
        res.status(200).json(participaciones);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener las participaciones por gasto.", error });
    }
}));
// Obtener participaciones por id_usuario
exports.participacionRouter.get("/usuario/:id_usuario", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id_usuario = req.params.id_usuario;
        const query = { id_usuario: id_usuario };
        const participaciones = yield database_1.collections.participaciones.find(query).toArray();
        res.status(200).json(participaciones);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener las participaciones por usuario.", error });
    }
}));
