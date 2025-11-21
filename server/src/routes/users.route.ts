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

// GET friend list for a user
userRouter.get("/:id/friends", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const user = await collections?.users?.findOne({ _id: new ObjectId(id) });
        if (!user) {
            return res.status(404).send(`User not found: ID ${id}`);
        }

        const friendIds = (user.friends || []).map((fid: any) => new ObjectId(fid));
        const friends = await collections?.users?.find({ _id: { $in: friendIds } }).toArray();

        // remove sensitive fields
        const safeFriends = friends?.map((f: any) => {
            const copy = { ...f };
            delete copy.password_hash;
            return copy;
        });

        res.status(200).send(safeFriends);
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// DELETE friend from user's friend list
// The other user must also remove this user as a friend for mutual removal
userRouter.delete("/:id/friends/:friendId", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const friendId = req?.params?.friendId;

        const user = await collections?.users?.findOne({ _id: new ObjectId(id) });
        if (!user) {
            return res.status(404).send(`User not found: ID ${id}`);
        }

        const updatedFriends = (user.friends || []).filter((fid: any) => fid.toString() !== friendId);

        const result = await collections?.users?.updateOne(
            { _id: new ObjectId(id) },
            { $set: { friends: updatedFriends } }
        );

        if (result && result.matchedCount) {
            res.status(200).send(`Removed friend ID ${friendId} from user ID ${id}.`);
        } else {
            res.status(500).send(`Failed to remove friend ID ${friendId} from user ID ${id}.`);
        }
    } catch (error) {
        res.status(500).send(error instanceof Error ? error.message : "Unknown error");
    }
});

// POST add friend to user's friend list
// The other user must also add this user as a friend for mutual friendship
userRouter.post("/:id/friends/:friendId", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const friendId = req?.params?.friendId;

        const user = await collections?.users?.findOne({ _id: new ObjectId(id) });
        if (!user) {
            return res.status(404).send(`User not found: ID ${id}`);
        }

        const friendObjectId = new ObjectId(friendId);
        const updatedFriends = user.friends || [];
        if (!updatedFriends.find((fid: any) => fid.toString() === friendId)) {
            updatedFriends.push(friendObjectId);
        }

        const result = await collections?.users?.updateOne(
            { _id: new ObjectId(id) },
            { $set: { friends: updatedFriends } }
        );

        if (result && result.matchedCount) {
            res.status(200).send(`Added friend ID ${friendId} to user ID ${id}.`);
        } else {
            res.status(500).send(`Failed to add friend ID ${friendId} to user ID ${id}.`);
        }
    } catch (error) {
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
