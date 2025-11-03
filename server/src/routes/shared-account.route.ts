import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { computeGroupBalances } from "../balances";

export const sharedAccountsRouter = express.Router();

// Obtener todas las cuentas compartidas
sharedAccountsRouter.get("/", async (_req: express.Request, res: express.Response) => {
  try {
    const sharedAccounts = await collections.sharedAccounts!.find({}).toArray();
      res.status(200).json(sharedAccounts);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las cuentas compartidas.", error });
  }
});

// Obtener una cuenta compartida por su ID de MongoDB
sharedAccountsRouter.get("/:id", async (req: express.Request, res: express.Response) => {
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

// Crear una nueva cuenta compartidas 
sharedAccountsRouter.post("/", async (req: express.Request, res: express.Response) => {
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

// Actualizar cuenta compartida
sharedAccountsRouter.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
  const id = req?.params?.id;
  const cuenta = req.body;

  if (cuenta.fecha_creacion) {
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

// Eliminar cuenta compartida
sharedAccountsRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req?.params?.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections?.sharedAccounts!.deleteOne(query);
    
    if (result && result.deletedCount) {
      res.status(202).send(`Cuenta compartida eliminada: ID ${id}`);
    } else if (!result) {
      res.status(400).send(`Fallo al eliminar la cuenta compartida: ID ${id}`);
    } else if (!result.deletedCount) {
      res.status(404).send(`Cuenta compartida no encontrada: ID ${id}`);
    }
  } catch (error) {
    console.error(error);
    res.status(400).send(error instanceof Error ? error.message : "Unknown error");
  }
});

sharedAccountsRouter.get("/:id/balances", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const balances = await computeGroupBalances(id);
    res.status(200).json(balances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al calcular balances.", error: error instanceof Error ? error.message : error });
  }
});

