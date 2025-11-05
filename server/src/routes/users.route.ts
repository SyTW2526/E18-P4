import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import * as bcrypt from "bcryptjs";

export const userRouter = express.Router();
userRouter.use(express.json());

// GET /users - list all users
userRouter.get("/", async (_req: express.Request, res: express.Response) => {
    try {
        const users = await collections?.users?.find({}).toArray();
        res.status(200).send(users);
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
            res.status(200).send(user);
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
        // ensure fecha_registro is set if not provided
        if (!user.fecha_registro) {
            user.fecha_registro = new Date();
        } else {
            user.fecha_registro = new Date(user.fecha_registro);
        }

        // Accept plaintext `password` and hash it into `password_hash` (if provided)
        if (user.password) {
            user.password_hash = bcrypt.hashSync(String(user.password), 10);
            delete user.password;
        }

        const result = await collections?.users?.insertOne(user);

        if (result?.acknowledged) {
            res.status(201).send(`Created a new user: ID ${result.insertedId}.`);
        } else {
            res.status(500).send("Failed to create a new user.");
        }
    } catch (error) {
        console.error(error);
        res.status(400).send(error instanceof Error ? error.message : "Unknown error");
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
            res.status(200).send(`Updated a user: ID ${id}.`);
        } else if (!result?.matchedCount) {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        } else {
            res.status(304).send(`Failed to update a user: ID ${id}`);
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
            res.status(202).send(`Removed a user: ID ${id}`);
        } else if (!result) {
            res.status(400).send(`Failed to remove a user: ID ${id}`);
        } else if (!result.deletedCount) {
            res.status(404).send(`Failed to find a user: ID ${id}`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});
