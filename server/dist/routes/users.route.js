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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// GET /users/lookup?username=... - find users by username (nombre) / username / email (case-insensitive)
exports.userRouter.get("/lookup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const raw = String(req.query.username || "").trim();
        if (!raw)
            return res.status(400).send("'username' query parameter is required");
        // exact case-insensitive match on nombre, username or email
        const regex = new RegExp(`^${raw}$`, 'i');
        const query = { $or: [{ nombre: regex }, { username: regex }, { email: regex }] };
        const users = yield ((_a = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _a === void 0 ? void 0 : _a.find(query).toArray());
        const safe = (users || []).map((u) => {
            const copy = Object.assign({}, u);
            delete copy.password_hash;
            return copy;
        });
        res.status(200).json(safe);
    }
    catch (error) {
        console.error(error);
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// GET /users/:id - get single user by Mongo _id
exports.userRouter.get("/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const user = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.findOne(query));
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
        res.status(404).send(`Failed to find a user: ID ${(_c = req === null || req === void 0 ? void 0 : req.params) === null || _c === void 0 ? void 0 : _c.id}`);
    }
}));
// POST /users - create a new user
exports.userRouter.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
        const result = yield ((_a = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _a === void 0 ? void 0 : _a.insertOne(user));
        if (result === null || result === void 0 ? void 0 : result.acknowledged) {
            res.status(201).json({ id: result.insertedId.toString(), message: `Created a new user` });
        }
        else {
            res.status(500).json({ message: "Failed to create a new user." });
        }
    }
    catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
}));
// POST /signup - register a new user and return a JWT
exports.userRouter.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
        const existing = yield ((_a = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _a === void 0 ? void 0 : _a.findOne({ email: String(email).toLowerCase() }));
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
        const result = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.insertOne(userDoc));
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
    var _a;
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).send("'email' and 'password' are required");
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET)
            return res.status(500).send("JWT_SECRET is not set on the server");
        const user = yield ((_a = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _a === void 0 ? void 0 : _a.findOne({ email: String(email).toLowerCase() }));
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
    var _a, _b;
    try {
        const id = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const user = req.body;
        // if fecha_registro provided, convert to Date
        if (user.fecha_registro)
            user.fecha_registro = new Date(user.fecha_registro);
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.updateOne(query, { $set: user }));
        if (result && result.matchedCount) {
            res.status(200).json({ id, message: `Updated a user` });
        }
        else if (!(result === null || result === void 0 ? void 0 : result.matchedCount)) {
            res.status(404).json({ message: `Failed to find a user: ID ${id}` });
        }
        else {
            res.status(304).json({ message: `Failed to update a user: ID ${id}` });
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
    var _a, _b;
    try {
        const id = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const query = { _id: new mongodb_1.ObjectId(id) };
        const result = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.deleteOne(query));
        if (result && result.deletedCount) {
            res.status(202).json({ id, message: `Removed a user` });
        }
        else if (!result) {
            res.status(400).json({ message: `Failed to remove a user: ID ${id}` });
        }
        else if (!result.deletedCount) {
            res.status(404).json({ message: `Failed to find a user: ID ${id}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
//ADD amigo, adds the sending user to the receiver's peticiones_amistad list
exports.userRouter.post("/:id/add-amigo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const receiverId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id; // the user receiving the friend request
        const { senderId } = req.body; // the user sending the friend request
        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }
        const query = { _id: new mongodb_1.ObjectId(receiverId) };
        const senderObjId = new mongodb_1.ObjectId(senderId);
        const update = { $addToSet: { peticiones_amistad: senderObjId } }; // add sender ObjectId to peticiones_amistad array
        const result = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.updateOne(query, update, { bypassDocumentValidation: true }));
        if (result && result.matchedCount) {
            res.status(200).json({ message: `Friend request sent from ${senderId} to ${receiverId}` });
        }
        else if (!(result === null || result === void 0 ? void 0 : result.matchedCount)) {
            res.status(404).json({ message: `Failed to find a user: ID ${receiverId}` });
        }
        else {
            res.status(500).json({ message: `Failed to send friend request from ${senderId} to ${receiverId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// ACCEPT amigo, moves one user from peticiones_amistad to amigos list.
// it also adds the user to the friend's amigos list
exports.userRouter.post("/:id/accept-amigo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const receiverId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id; // the user accepting the friend request
        const { senderId } = req.body; // the user who sent the friend request
        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }
        // Remove senderId from peticiones_amistad and add to amigos
        const receiverQuery = { _id: new mongodb_1.ObjectId(receiverId) };
        const senderObjId = new mongodb_1.ObjectId(senderId);
        const receiverObjId = new mongodb_1.ObjectId(receiverId);
        const receiverUpdate = {
            $pull: { peticiones_amistad: senderObjId },
            $addToSet: { amigos: senderObjId }
        };
        const receiverResult = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.updateOne(receiverQuery, receiverUpdate, { bypassDocumentValidation: true }));
        // Add receiverId to sender's amigos list (store as ObjectId)
        const senderQuery = { _id: senderObjId };
        const senderUpdate = { $addToSet: { amigos: receiverObjId } };
        const senderResult = yield ((_c = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _c === void 0 ? void 0 : _c.updateOne(senderQuery, senderUpdate, { bypassDocumentValidation: true }));
        if (receiverResult && receiverResult.matchedCount && senderResult && senderResult.matchedCount) {
            res.status(200).json({ message: `User ${receiverId} accepted friend request from ${senderId}` });
        }
        else {
            res.status(404).json({ message: `Failed to find one or both users: ID ${receiverId}, ID ${senderId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// GET friend requests for a user
exports.userRouter.get("/:id/peticiones-amistad", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const query = { _id: new mongodb_1.ObjectId(userId) };
        const user = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.findOne(query));
        if (user) {
            const peticiones = user.peticiones_amistad || [];
            res.status(200).json({ peticiones_amistad: peticiones });
        }
        else {
            res.status(404).json({ message: `Failed to find a user: ID ${userId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// GET friends list for a user
exports.userRouter.get("/:id/amigos", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const query = { _id: new mongodb_1.ObjectId(userId) };
        const user = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.findOne(query));
        if (user) {
            const amigos = user.amigos || [];
            res.status(200).json({ amigos: amigos });
        }
        else {
            res.status(404).json({ message: `Failed to find a user: ID ${userId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// DELETE amigo, removes a friend from the user's amigos list, it also
// removes the user from the friend's amigos list
exports.userRouter.delete("/:id/remove-amigo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id; // the user removing the friend
        const { amigoId } = req.body; // the friend to be removed
        if (!amigoId) {
            return res.status(400).send("'amigoId' is required in the request body");
        }
        // Remove amigoId from user's amigos list
        const userQuery = { _id: new mongodb_1.ObjectId(userId) };
        const amigoObjId = new mongodb_1.ObjectId(amigoId);
        const userUpdate = { $pull: { amigos: amigoObjId } };
        const userResult = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.updateOne(userQuery, userUpdate, { bypassDocumentValidation: true }));
        // Remove userId from amigo's amigos list
        const amigoQuery = { _id: amigoObjId };
        const userObjId = new mongodb_1.ObjectId(userId);
        const amigoUpdate = { $pull: { amigos: userObjId } };
        const amigoResult = yield ((_c = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _c === void 0 ? void 0 : _c.updateOne(amigoQuery, amigoUpdate, { bypassDocumentValidation: true }));
        if (userResult && userResult.matchedCount && amigoResult && amigoResult.matchedCount) {
            res.status(200).json({ message: `Removed amigo ${amigoId} from user ${userId} and vice versa` });
        }
        else {
            res.status(404).json({ message: `Failed to find one or both users: ID ${userId}, ID ${amigoId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
// Reject amigo, removes one user from another user's peticiones_amistad list
exports.userRouter.post("/:id/reject-amigo", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const receiverId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id; // the user rejecting the friend request
        const { senderId } = req.body; // the user who sent the friend request
        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }
        const query = { _id: new mongodb_1.ObjectId(receiverId) };
        const senderObjId = new mongodb_1.ObjectId(senderId);
        const update = { $pull: { peticiones_amistad: senderObjId } }; // remove sender ObjectId from peticiones_amistad array
        const result = yield ((_b = database_1.collections === null || database_1.collections === void 0 ? void 0 : database_1.collections.users) === null || _b === void 0 ? void 0 : _b.updateOne(query, update, { bypassDocumentValidation: true }));
        if (result && result.matchedCount) {
            res.status(200).json({ message: `Friend request from ${senderId} to ${receiverId} rejected` });
        }
        else if (!(result === null || result === void 0 ? void 0 : result.matchedCount)) {
            res.status(404).json({ message: `Failed to find a user: ID ${receiverId}` });
        }
        else {
            res.status(500).json({ message: `Failed to reject friend request from ${senderId} to ${receiverId}` });
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
}));
