import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { computeGroupBalances, computeDetailedBalances } from "../balances";

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

   if (result && result.matchedCount) {
      res.status(200).json({ id, message: `Updated shared account` });
    } else if (!result?.matchedCount) {
      res.status(404).json({ message: `Failed to find shared account: ID ${id}` });
    } else {
      res.status(304).json({ message: `Failed to update shared account: ID ${id}` });
    }
  } catch (error) {
    console.error('Shared account update error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    // If Mongo validation error, include details
    const details: any = (error as any)?.errInfo || (error as any)?.errorResponse || error;
    res.status(400).json({ message, details });
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

// Obtener balance detallado (quién debe a quién)
sharedAccountsRouter.get("/:id/balances-detailed", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const detailedBalances = await computeDetailedBalances(id);
    res.status(200).json(detailedBalances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al calcular balances detallados.", error: error instanceof Error ? error.message : error });
  }
});


