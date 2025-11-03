import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";

export const userGroupRouter = express.Router();

// Obtener todas las cuentas/grupos compartidos
userGroupRouter.get("/shared-accounts", async (_req: express.Request, res: express.Response) => {
  try {
    const sharedAccounts = await collections.sharedAccounts!.find({}).toArray();
    res.status(200).json(sharedAccounts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cuentas compartidas.", error });
  }
});

// Obtener una cuenta/grupo compartido por su ID de MongoDB
userGroupRouter.get("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const item = await collections.sharedAccounts!.findOne(query);
    if (item) {
      res.status(200).send(item);
    } else {
      res.status(404).send({ message: "Cuenta compartida no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al obtener la cuenta compartida.", error });
  }
});

// Crear una nueva cuenta/grupo compartido
userGroupRouter.post("/shared-accounts", async (req: express.Request, res: express.Response) => {
  try {
    const cuenta = req.body;
    // asegurar que la fecha de creación sea un objeto Date
    if(!cuenta.fecha_creacion) {
      cuenta.fecha_creacion = new Date();
    } else {
      cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
    }

    if(cuenta.moneda && typeof cuenta.moneda === "string") {
      cuenta.moneda = cuenta.moneda.toUpperCase();
    }

    const result = await collections?.sharedAccounts!.insertOne(cuenta);
    result
      ? res.status(201).send({ message: "Cuenta compartida creada.", id: result.insertedId })
      : res.status(500).send({ message: "Error al crear la cuenta compartida." });
  }
  catch (error) {
    res.status(400).send({ message: "Error al crear la cuenta compartida.", error });
  }
});

// Actualizar cuenta/grupo compartido
userGroupRouter.put("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const cuenta = req.body;

    // asegurar que la fecha de creación sea un objeto Date si se proporciona
    if(cuenta.fecha_creacion) {
      cuenta.fecha_creacion = new Date(cuenta.fecha_creacion);
    }

    if(cuenta.moneda && typeof cuenta.moneda === "string") {
      cuenta.moneda = cuenta.moneda.toUpperCase();
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.updateOne(query, { $set: cuenta });

    if (result?.acknowledged) {
      res.status(201).send(`Created a new shared account: ID ${result.upsertedId}.`);
    } else {
      res.status(500).send("Failed to create a new shared account.");
    }
  } catch (error) {
    console.error(error);
    res.status(400).send(error instanceof Error ? error.message : "Unknown error");
  }
});

// Eliminar cuenta/grupo compartido
userGroupRouter.delete("/shared-accounts/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.deleteOne(query);
    
    if (result && result.deletedCount) {
      res.status(202).send({ message: "Cuenta compartida eliminada." });
    } else {
      res.status(404).send({ message: "Cuenta compartida no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al eliminar la cuenta compartida.", error });
  }
});
