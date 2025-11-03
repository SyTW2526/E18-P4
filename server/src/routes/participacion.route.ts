import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "./../database";

export const participacionRouter = express.Router();

// Obtener todas las participaciones
participacionRouter.get("/", async (_req: express.Request, res: express.Response) => {
  try {
    const participaciones = await collections.participaciones!.find({}).toArray();
      res.status(200).json(participaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las participaciones.", error });
  }
});

// Obtener una participacion por su ID de MongoDB
participacionRouter.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const item = await collections.participaciones!.findOne(query);
    if (item) {
      res.status(200).send(item);
    } else {
      res.status(404).send({ message: "Participacion no encontrada." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al obtener la participacion.", error });
  }
});

// Crear una nueva participacion 
participacionRouter.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const participacion = req.body;

    const result = await collections?.participaciones!.insertOne(participacion);
    result
      ? res.status(201).send({ message: "Participacion creada.", id: result.insertedId })
      : res.status(500).send({ message: "Error al crear la participacion." });
  }
  catch (error) {
    res.status(400).send({ message: "Error al crear la participacion.", error });
  }
});

// Actualizar participacion
participacionRouter.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const participacion = req.body;

    const query = { _id: new ObjectId(id) };
    const result = await collections?.participaciones!.updateOne(query, { $set: participacion });

    if (result?.acknowledged) {
      res.status(201).send(`Created a new participacion: ID ${result.upsertedId}.`);
    } else {
      res.status(500).send("Failed to create a new participacion.");
    }
  } catch (error) {
    res.status(400).send({ message: "Error al actualizar la participacion.", error });
  }
});

// Eliminar una participacion por su ID de MongoDB
participacionRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections.participaciones!.deleteOne(query);
    result.deletedCount
      ? res.status(200).send({ message: "Participacion eliminada." })
      : res.status(404).send({ message: "Participacion no encontrada." });
  } catch (error) {
    res.status(500).send({ message: "Error al eliminar la participacion.", error });
  }
});

// Obtener participaciones por id_gasto
participacionRouter.get("/gasto/:id_gasto", async (req: express.Request, res: express.Response) => {
  try {
    const id_gasto = req.params.id_gasto;
    const query = { id_gasto: id_gasto };
    const participaciones = await collections.participaciones!.find(query).toArray();
    res.status(200).json(participaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las participaciones por gasto.", error });
  }
}); 

// Obtener participaciones por id_usuario
participacionRouter.get("/usuario/:id_usuario", async (req: express.Request, res: express.Response) => {
  try {
    const id_usuario = req.params.id_usuario;
    const query = { id_usuario: id_usuario };
    const participaciones = await collections.participaciones!.find(query).toArray();
    res.status(200).json(participaciones);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener las participaciones por usuario.", error });
  }
});

