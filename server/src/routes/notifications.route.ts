import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { Notification } from "../notifications";

export const notificationsRouter = express.Router();

// GET /notifications/:userId - obtener notificaciones de un usuario
notificationsRouter.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ error: "Invalid user ID" });
    }

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const notifications = await collection
      .find({ para_usuario: new ObjectId(userId) })
      .sort({ fecha: -1 })
      .toArray();
    
    res.status(200).send(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).send({ error: "Failed to fetch notifications" });
  }
});

// GET /notifications/:userId/unread - obtener notificaciones no leidas
notificationsRouter.get("/:userId/unread", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!ObjectId.isValid(userId)) {
      return res.status(400).send({ error: "Invalid user ID" });
    }

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const count = await collection.countDocuments({
      para_usuario: new ObjectId(userId),
      leida: false
    });
    
    res.status(200).send({ count });
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    res.status(500).send({ error: "Failed to count unread notifications" });
  }
});

// POST /notifications - crear nueva notificacion
notificationsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { tipo, de_usuario, para_usuario, id_grupo, monto, id_gasto, mensaje } = req.body;
    
    if (!tipo || !de_usuario || !para_usuario || !id_grupo) {
      return res.status(400).send({ error: "Missing required fields" });
    }

    if (!ObjectId.isValid(de_usuario) || !ObjectId.isValid(para_usuario) || !ObjectId.isValid(id_grupo)) {
      return res.status(400).send({ error: "Invalid ObjectId format" });
    }

    const notification: Notification = {
      tipo,
      de_usuario: new ObjectId(de_usuario),
      para_usuario: new ObjectId(para_usuario),
      id_grupo: new ObjectId(id_grupo),
      monto: monto || undefined,
      id_gasto: id_gasto ? new ObjectId(id_gasto) : undefined,
      mensaje: mensaje || undefined,
      leida: false,
      respondida: false,
      fecha: new Date()
    };

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const result = await collection.insertOne(notification);
    
    res.status(201).send({ 
      _id: result.insertedId,
      ...notification 
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).send({ error: "Failed to create notification" });
  }
});

// PATCH /notifications/:id/read - marcar notificacion como leida
notificationsRouter.patch("/:id/read", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid notification ID" });
    }

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { leida: true } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Notification not found" });
    }
    
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).send({ error: "Failed to mark notification as read" });
  }
});

// PATCH /notifications/:id/respond - marcar notificacion como respondida
notificationsRouter.patch("/:id/respond", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid notification ID" });
    }

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { respondida: true, leida: true } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).send({ error: "Notification not found" });
    }
    
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error marking notification as responded:", error);
    res.status(500).send({ error: "Failed to mark notification as responded" });
  }
});

// DELETE /notifications/:id - eliminar notificacion
notificationsRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid notification ID" });
    }

    const collection = collections.notifications;
    if (!collection) {
      return res.status(500).send({ error: "Notifications collection not initialized" });
    }
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).send({ error: "Notification not found" });
    }
    
    res.status(200).send({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).send({ error: "Failed to delete notification" });
  }
});
