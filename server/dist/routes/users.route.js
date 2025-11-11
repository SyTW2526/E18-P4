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
exports.userRouter = void 0;
const express = __importStar(require("express"));
const mongodb_1 = require("mongodb");
const database_1 = require("../database");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
exports.userRouter = express.Router();
exports.userRouter.use(express.json());
// GET /users - list all users
exports.userRouter.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const users = yield ((_a = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _a === void 0 ? void 0 : _a.find({}).toArray());
        // remove sensitive fields before sending
        const safe = users === null || users === void 0 ? void 0 : users.map((u) => {
            const copy = Object.assign({}, u);
            delete copy.password_hash;
            return copy;
        });
        res.status(200).send(safe);
    }
    catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// GET /users/:id - get single user by Mongo _id
exports.userRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const id = (_b = req === null || req === void 0 ? void 0 : req.params) === null || _b === void 0 ? void 0 : _b.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const user = yield ((_c = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _c === void 0 ? void 0 : _c.findOne(query));
        if (user) {
            const safe = Object.assign({}, user);
            delete safe.password_hash;
            res.status(200).send(safe);
        }
        else {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        }
    }
    catch (error) {
        res.status(404).send(`Failed to find a user: ID ${(_d = req === null || req === void 0 ? void 0 : req.params) === null || _d === void 0 ? void 0 : _d.id}`);
    }
}));
// POST /users - create a new user
exports.userRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const user = req.body;
        if (!user.fecha_registro) {
            user.fecha_registro = new Date();
        }
        else {
            user.fecha_registro = new Date(user.fecha_registro);
        }
        if (user.password) {
            user.password_hash = bcrypt.hashSync(String(user.password), 10);
            delete user.password;
        }
        const result = yield ((_e = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _e === void 0 ? void 0 : _e.insertOne(user));
        if (result === null || result === void 0 ? void 0 : result.acknowledged) {
            res.status(201).send(`Created a new user: ID ${result.insertedId}.`);
        }
        else {
            res.status(500).send("Failed to create a new user.");
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// POST /signup - register a new user and return a JWT
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { nombre, email, password, foto_perfil, preferencia_tema } = req.body;
        if (!nombre || !email || !password) {
            return res.status(400).send("'nombre', 'email' and 'password' are required");
        }
        // check JWT secret
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).send("JWT_SECRET is not set on the server");
        }
        // ensure email is unique
        const existing = yield ((_f = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _f === void 0 ? void 0 : _f.findOne({ email: String(email).toLowerCase() }));
        if (existing)
            return res.status(409).send("A user with that email already exists");
        const password_hash = bcrypt.hashSync(String(password), 10);
        const userDoc = {
            nombre,
            email: String(email).toLowerCase(),
            password_hash,
            fecha_registro: new Date(),
            preferencia_tema: preferencia_tema || "claro",
        };
        if (foto_perfil)
            userDoc.foto_perfil = foto_perfil;
        const result = yield ((_g = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _g === void 0 ? void 0 : _g.insertOne(userDoc));
        if (!(result === null || result === void 0 ? void 0 : result.acknowledged))
            return res.status(500).send("Failed to create user");
        const userId = result.insertedId;
        const token = jwt.sign({ userId: userId.toString(), email: userDoc.email }, JWT_SECRET, { expiresIn: '7d' });
        const safe = Object.assign(Object.assign({}, userDoc), { _id: userId });
        delete safe.password_hash;
        return res.status(201).json({ user: safe, token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).send(err instanceof Error ? err.message : 'Unknown error');
    }
}));
// POST /signin - authenticate and return JWT
exports.userRouter.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).send("'email' and 'password' are required");
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET)
            return res.status(500).send("JWT_SECRET is not set on the server");
        const user = yield ((_h = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _h === void 0 ? void 0 : _h.findOne({ email: String(email).toLowerCase() }));
        if (!user)
            return res.status(401).send("Invalid email or password");
        const ok = bcrypt.compareSync(String(password), String(user.password_hash || ''));
        if (!ok)
            return res.status(401).send("Invalid email or password");
        const token = jwt.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        const safe = Object.assign({}, user);
        delete safe.password_hash;
        return res.status(200).json({ user: safe, token });
    }
    catch (err) {
        console.error(err);
        return res.status(500).send(err instanceof Error ? err.message : 'Unknown error');
    }
}));
// PUT /users/:id - update user (partial updates allowed)
exports.userRouter.put("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        const id = (_j = req === null || req === void 0 ? void 0 : req.params) === null || _j === void 0 ? void 0 : _j.id;
        const user = req.body;
        // if fecha_registro provided, convert to Date
        if (user.fecha_registro)
            user.fecha_registro = new Date(user.fecha_registro);
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield ((_k = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _k === void 0 ? void 0 : _k.updateOne(query, { $set: user }));
        if (result && result.matchedCount) {
            res.status(200).send(`Updated a user: ID ${id}.`);
        }
        else if (!(result === null || result === void 0 ? void 0 : result.matchedCount)) {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        }
        else {
            res.status(304).send(`Failed to update a user: ID ${id}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// DELETE /users/:id - remove user by _id
exports.userRouter.delete("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m;
    try {
        const id = (_l = req === null || req === void 0 ? void 0 : req.params) === null || _l === void 0 ? void 0 : _l.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield ((_m = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _m === void 0 ? void 0 : _m.deleteOne(query));
        if (result && result.deletedCount) {
            res.status(202).send(`Removed a user: ID ${id}`);
        }
        else if (!result) {
            res.status(400).send(`Failed to remove a user: ID ${id}`);
        }
        else if (!result.deletedCount) {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
