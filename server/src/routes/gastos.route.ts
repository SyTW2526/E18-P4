import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "./database";

export const GastosRouter = express.Router();

// Obtener todos los gastos de un grupo
GastosRouter.get("/grupo/:id_grupo", async (req: express.Request, res: express.Response) => {
  try {
    const id_grupo = req.params.id_grupo;
    const gastos = await collections.gastos!.find({ id_grupo: id_grupo }).toArray();
    res.status(200).json(gastos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener los gastos del grupo.", error });
  }
});

// Agregar un nuevo gasto
GastosRouter.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const gasto = req.body;
    // Asegurar que la fecha sea un objeto Date
    gasto.fecha = new Date(gasto.fecha);

    const result = await collections.gastos!.insertOne(gasto);
    result
      ? res.status(201).send({ message: "Gasto agregado.", id: result.insertedId })
      : res.status(500).send({ message: "Error al agregar el gasto." });
  } catch (error) {
    res.status(400).send({ message: "Error al agregar el gasto.", error });
  }
});

// Eliminar un gasto por su ID de MongoDB
GastosRouter.delete("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await collections.gastos!.deleteOne(query);
    result.deletedCount
      ? res.status(200).send({ message: "Gasto eliminado." })
      : res.status(404).send({ message: "Gasto no encontrado." });
  } catch (error) {
    res.status(500).send({ message: "Error al eliminar el gasto.", error });
  }
});

// Actualizar un gasto por su ID de MongoDB
GastosRouter.put("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const gastoActualizado = req.body;
    // Asegurar que la fecha sea un objeto Date
    if (gastoActualizado.fecha) {
      gastoActualizado.fecha = new Date(gastoActualizado.fecha);
    }

    const query = { _id: new ObjectId(id) };
    const result = await collections.gastos!.updateOne(query, { $set: gastoActualizado });
    result.matchedCount
      ? res.status(200).send({ message: "Gasto actualizado." })
      : res.status(404).send({ message: "Gasto no encontrado." });
  } catch (error) {
    res.status(500).send({ message: "Error al actualizar el gasto.", error });
  }
});

// Obtener un gasto por su ID de MongoDB
GastosRouter.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const gasto = await collections.gastos!.findOne(query);
    if (gasto) {
      res.status(200).send(gasto);
    } else {
      res.status(404).send({ message: "Gasto no encontrado." });
    }
  } catch (error) {
    res.status(500).send({ message: "Error al obtener el gasto.", error });
  }
});

