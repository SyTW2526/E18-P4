import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";

export const userRouter = express.Router();
userRouter.use(express.json());

// GET /users - list all users
userRouter.get("/", async (_req: express.Request, res: express.Response) => {
    try {
        const users = await collections?.users?.find({}).toArray();
        // remove sensitive fields before sending
        const safe = users?.map((u: any) => {
            const copy = { ...u };
            delete copy.password_hash;
            return copy;
        });
        res.status(200).send(safe);
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// GET /users/lookup?username=... - find users by username (nombre) / username / email (case-insensitive)
userRouter.get("/lookup", async (req: express.Request, res: express.Response) => {
    try {
        const raw = String(req.query.username || "").trim();
        if (!raw) return res.status(400).send("'username' query parameter is required");

        // exact case-insensitive match on nombre, username or email
        const regex = new RegExp(`^${raw}$`, 'i');
        const query = { $or: [{ nombre: regex }, { username: regex }, { email: regex }] };
        const users = await collections?.users?.find(query).toArray();

        const safe = (users || []).map((u: any) => {
            const copy = { ...u };
            delete copy.password_hash;
            return copy;
        });
        res.status(200).json(safe);
    } catch (error) {
        console.error(error);
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// GET /users/:id - get single user by Mongo _id
userRouter.get("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const user = await collections?.users?.findOne(query);

        if (user) {
            const safe = { ...user } as any;
            delete safe.password_hash;
            res.status(200).send(safe);
        } else {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        }
    } catch (error) {
        res.status(404).send(`Failed to find a user: ID ${req?.params?.id}`);
    }
});

// POST /users - create a new user
userRouter.post("/", async (req: express.Request, res: express.Response) => {
    try {
        const user = req.body;
        if (!user.fecha_registro) {
            user.fecha_registro = new Date();
        } else {
            user.fecha_registro = new Date(user.fecha_registro);
        }

        if (user.password) {
            user.password_hash = bcrypt.hashSync(String(user.password), 10);
            delete user.password;
        }

        const result = await collections?.users?.insertOne(user);

        if (result?.acknowledged) {
            res.status(201).json({ id: result.insertedId.toString(), message: `Created a new user` });
        } else {
            res.status(500).json({ message: "Failed to create a new user." });
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// POST /signup - register a new user and return a JWT
userRouter.post("/signup", async (req: express.Request, res: express.Response) => {
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
        const existing = await collections?.users?.findOne({ email: String(email).toLowerCase() });
        if (existing) return res.status(409).send("A user with that email already exists");

        const password_hash = bcrypt.hashSync(String(password), 10);

        const userDoc: any = {
            nombre,
            email: String(email).toLowerCase(),
            password_hash,
            fecha_registro: new Date(),
            preferencia_tema: preferencia_tema || "claro",
        };
        if (foto_perfil) userDoc.foto_perfil = foto_perfil;

        const result = await collections?.users?.insertOne(userDoc);
        if (!result?.acknowledged) return res.status(500).send("Failed to create user");

        const userId = result.insertedId;
        const token = jwt.sign({ userId: userId.toString(), email: userDoc.email }, JWT_SECRET, { expiresIn: '7d' });

        const safe = { ...userDoc, _id: userId };
        delete safe.password_hash;

        return res.status(201).json({ user: safe, token });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err instanceof Error ? err.message : 'Unknown error');
    }
});

// POST /signin - authenticate and return JWT
userRouter.post("/signin", async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send("'email' and 'password' are required");

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) return res.status(500).send("JWT_SECRET is not set on the server");

        const user = await collections?.users?.findOne({ email: String(email).toLowerCase() });
        if (!user) return res.status(401).send("Invalid email or password");

        const ok = bcrypt.compareSync(String(password), String((user as any).password_hash || ''));
        if (!ok) return res.status(401).send("Invalid email or password");

        const token = jwt.sign({ userId: (user as any)._id.toString(), email: (user as any).email }, JWT_SECRET, { expiresIn: '7d' });

        const safe = { ...user } as any;
        delete safe.password_hash;

        return res.status(200).json({ user: safe, token });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err instanceof Error ? err.message : 'Unknown error');
    }
});

// PUT /users/:id - update user (partial updates allowed)
userRouter.put("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const user = req.body;
        // if fecha_registro provided, convert to Date
        if (user.fecha_registro) user.fecha_registro = new Date(user.fecha_registro);

        const query = { _id: new ObjectId(id) };
        const result = await collections?.users?.updateOne(query, { $set: user });

        if (result && result.matchedCount) {
            res.status(200).json({ id, message: `Updated a user` });
        } else if (!result?.matchedCount) {
            res.status(404).json({ message: `Failed to find a user: ID ${id}` });
        } else {
            res.status(304).json({ message: `Failed to update a user: ID ${id}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// DELETE /users/:id - remove user by _id
userRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const query = { _id: new ObjectId(id) };
        const result = await collections?.users?.deleteOne(query);

        if (result && result.deletedCount) {
            res.status(202).json({ id, message: `Removed a user` });
        } else if (!result) {
            res.status(400).json({ message: `Failed to remove a user: ID ${id}` });
        } else if (!result.deletedCount) {
            res.status(404).json({ message: `Failed to find a user: ID ${id}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});


//ADD amigo, adds the sending user to the receiver's peticiones_amistad list
userRouter.post("/:id/add-amigo", async (req: express.Request, res: express.Response) => {
    try {
        const receiverId = req?.params?.id; // the user receiving the friend request
        const { senderId } = req.body; // the user sending the friend request

        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }

        const query = { _id: new ObjectId(receiverId) };
        const senderObjId = new ObjectId(senderId);
        const update = { $addToSet: { peticiones_amistad: senderObjId as any } }; // add sender ObjectId to peticiones_amistad array

        const result = await collections?.users?.updateOne(query, update, { bypassDocumentValidation: true });

        if (result && result.matchedCount) {
            res.status(200).json({ message: `Friend request sent from ${senderId} to ${receiverId}` });
        } else if (!result?.matchedCount) {
            res.status(404).json({ message: `Failed to find a user: ID ${receiverId}` });
        } else {
            res.status(500).json({ message: `Failed to send friend request from ${senderId} to ${receiverId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// ACCEPT amigo, moves one user from peticiones_amistad to amigos list.
// it also adds the user to the friend's amigos list
userRouter.post("/:id/accept-amigo", async (req: express.Request, res: express.Response) => {
    try {
        const receiverId = req?.params?.id; // the user accepting the friend request
        const { senderId } = req.body; // the user who sent the friend request

        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }

        // Remove senderId from peticiones_amistad and add to amigos
        const receiverQuery = { _id: new ObjectId(receiverId) };
        const senderObjId = new ObjectId(senderId);
        const receiverObjId = new ObjectId(receiverId);
        const receiverUpdate = {
            $pull: { peticiones_amistad: senderObjId as any },
            $addToSet: { amigos: senderObjId as any }
        };
        const receiverResult = await collections?.users?.updateOne(receiverQuery, receiverUpdate, { bypassDocumentValidation: true });

        // Add receiverId to sender's amigos list (store as ObjectId)
        const senderQuery = { _id: senderObjId };
        const senderUpdate = { $addToSet: { amigos: receiverObjId as any } };
        const senderResult = await collections?.users?.updateOne(senderQuery, senderUpdate, { bypassDocumentValidation: true });

        if (receiverResult && receiverResult.matchedCount && senderResult && senderResult.matchedCount) {
            res.status(200).json({ message: `User ${receiverId} accepted friend request from ${senderId}` });
        } else {
            res.status(404).json({ message: `Failed to find one or both users: ID ${receiverId}, ID ${senderId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// GET friend requests for a user
userRouter.get("/:id/peticiones-amistad", async (req: express.Request, res: express.Response) => {
    try {
        const userId = req?.params?.id;

        const query = { _id: new ObjectId(userId) };
        const user = await collections?.users?.findOne(query);

        if (user) {
            const peticiones = user.peticiones_amistad || [];
            res.status(200).json({ peticiones_amistad: peticiones });
        } else {
            res.status(404).json({ message: `Failed to find a user: ID ${userId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// GET friends list for a user
userRouter.get("/:id/amigos", async (req: express.Request, res: express.Response) => {
    try {
        const userId = req?.params?.id;

        const query = { _id: new ObjectId(userId) };
        const user = await collections?.users?.findOne(query);

        if (user) {
            const amigos = user.amigos || [];
            res.status(200).json({ amigos: amigos });
        } else {
            res.status(404).json({ message: `Failed to find a user: ID ${userId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// DELETE amigo, removes a friend from the user's amigos list, it also
// removes the user from the friend's amigos list
userRouter.delete("/:id/remove-amigo", async (req: express.Request, res: express.Response) => {
    try {
        const userId = req?.params?.id; // the user removing the friend
        const { amigoId } = req.body; // the friend to be removed

        if (!amigoId) {
            return res.status(400).send("'amigoId' is required in the request body");
        }

        // Remove amigoId from user's amigos list
        const userQuery = { _id: new ObjectId(userId) };
        const amigoObjId = new ObjectId(amigoId);
        const userUpdate = { $pull: { amigos: amigoObjId as any } };
        const userResult = await collections?.users?.updateOne(userQuery, userUpdate, { bypassDocumentValidation: true });

        // Remove userId from amigo's amigos list
        const amigoQuery = { _id: amigoObjId };
        const userObjId = new ObjectId(userId);
        const amigoUpdate = { $pull: { amigos: userObjId as any } };
        const amigoResult = await collections?.users?.updateOne(amigoQuery, amigoUpdate, { bypassDocumentValidation: true });

        if (userResult && userResult.matchedCount && amigoResult && amigoResult.matchedCount) {
            res.status(200).json({ message: `Removed amigo ${amigoId} from user ${userId} and vice versa` });
        } else {
            res.status(404).json({ message: `Failed to find one or both users: ID ${userId}, ID ${amigoId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// Reject amigo, removes one user from another user's peticiones_amistad list
userRouter.post("/:id/reject-amigo", async (req: express.Request, res: express.Response) => {
    try {
        const receiverId = req?.params?.id; // the user rejecting the friend request
        const { senderId } = req.body; // the user who sent the friend request

        if (!senderId) {
            return res.status(400).send("'senderId' is required in the request body");
        }

        const query = { _id: new ObjectId(receiverId) };
        const senderObjId = new ObjectId(senderId);
        const update = { $pull: { peticiones_amistad: senderObjId as any } }; // remove sender ObjectId from peticiones_amistad array

        const result = await collections?.users?.updateOne(query, update, { bypassDocumentValidation: true });

        if (result && result.matchedCount) {
            res.status(200).json({ message: `Friend request from ${senderId} to ${receiverId} rejected` });
        } else if (!result?.matchedCount) {
            res.status(404).json({ message: `Failed to find a user: ID ${receiverId}` });
        } else {
            res.status(500).json({ message: `Failed to reject friend request from ${senderId} to ${receiverId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});