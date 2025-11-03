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
exports.GastosRouter = void 0;
const express = __importStar(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("./database");
exports.GastosRouter = express.Router();
// Obtener todos los gastos de un grupo
exports.GastosRouter.get("/grupo/:id_grupo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id_grupo = req.params.id_grupo;
        const gastos = yield database_1.collections.gastos.find({ id_grupo: id_grupo }).toArray();
        res.status(200).json(gastos);
    }
    catch (error) {
        res.status(500).json({ message: "Error al obtener los gastos del grupo.", error });
    }
}));
// Agregar un nuevo gasto
exports.GastosRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const gasto = req.body;
        // Asegurar que la fecha sea un objeto Date
        gasto.fecha = new Date(gasto.fecha);
        const result = yield database_1.collections.gastos.insertOne(gasto);
        result
            ? res.status(201).send({ message: "Gasto agregado.", id: result.insertedId })
            : res.status(500).send({ message: "Error al agregar el gasto." });
    }
    catch (error) {
        res.status(400).send({ message: "Error al agregar el gasto.", error });
    }
}));
// Eliminar un gasto por su ID de MongoDB
exports.GastosRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield database_1.collections.gastos.deleteOne(query);
        result.deletedCount
            ? res.status(200).send({ message: "Gasto eliminado." })
            : res.status(404).send({ message: "Gasto no encontrado." });
    }
    catch (error) {
        res.status(500).send({ message: "Error al eliminar el gasto.", error });
    }
}));
// Actualizar un gasto por su ID de MongoDB
exports.GastosRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const gastoActualizado = req.body;
        // Asegurar que la fecha sea un objeto Date
        if (gastoActualizado.fecha) {
            gastoActualizado.fecha = new Date(gastoActualizado.fecha);
        }
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield database_1.collections.gastos.updateOne(query, { $set: gastoActualizado });
        result.matchedCount
            ? res.status(200).send({ message: "Gasto actualizado." })
            : res.status(404).send({ message: "Gasto no encontrado." });
    }
    catch (error) {
        res.status(500).send({ message: "Error al actualizar el gasto.", error });
    }
}));
// Obtener un gasto por su ID de MongoDB
exports.GastosRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const gasto = yield database_1.collections.gastos.findOne(query);
        if (gasto) {
            res.status(200).send(gasto);
        }
        else {
            res.status(404).send({ message: "Gasto no encontrado." });
        }
    }
    catch (error) {
        res.status(500).send({ message: "Error al obtener el gasto.", error });
    }
}));
