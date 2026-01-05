import * as express from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

export const userRouter = express.Router();
userRouter.use(express.json());

// Simple JWT auth middleware for protecting certain user routes
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
        const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
        if (!authHeader) return res.status(401).send('Authorization header required');
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).send('Invalid Authorization format');
        const token = parts[1];
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) return res.status(500).send('Server JWT not configured');
        const payload: any = jwt.verify(token, JWT_SECRET);
        // attach the authenticated userId to the request for downstream handlers
        (req as any).authUserId = payload?.userId;
        return next();
    } catch (err) {
        console.error('Auth failure', err);
        return res.status(401).send('Invalid or expired token');
    }
}

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
// GET /users/:id - get single user by Mongo _id
// Protected: only the owner or friends may view full profile

// GET /users/:id/basic - get basic user info (for friend requests, etc) - public endpoint
userRouter.get("/:id/basic", async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;

        const query = { _id: new ObjectId(id) };
        const user = await collections?.users?.findOne(query);
        if (user) {
            const safe = {
                _id: user._id,
                nombre: user.nombre,
                email: user.email,
                foto_perfil: user.foto_perfil
            };
            return res.status(200).send(safe);
        }
        return res.status(404).send(`Failed to find a user: ID ${id}`);
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(message);
        res.status(400).send(message);
    }
});

// GET /users/search - search users by name or email (NO auth required)
userRouter.get("/search", async (req: express.Request, res: express.Response) => {
  try {
    const query = req.query.q as string;
    console.log('[Search Users] Query:', query);
    
    if (!query || query.length < 2) {
      console.log('[Search Users] Error: Query too short or missing');
      return res.status(400).json({ message: "Busca al menos 2 caracteres" });
    }

    console.log('[Search Users] Searching for:', query);
    const results = await collections.users!.find({
      $or: [
        { nombre: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    }).limit(10).toArray();

    console.log('[Search Users] Found', results.length, 'results');
    results.forEach((u: any) => {
      console.log('[Search Users] Result:', u.nombre, '(' + u.email + ')');
    });

    const safe = results.map((u: any) => ({
      _id: u._id,
      nombre: u.nombre,
      email: u.email,
      foto_perfil: u.foto_perfil
    }));

    res.status(200).json(safe);
  } catch (error) {
    console.error('[Search Users] Error:', error);
    res.status(500).json({ message: "Error en la búsqueda" });
  }
});

userRouter.get("/:id", authenticate, async (req: express.Request, res: express.Response) => {
    try {
        const id = req?.params?.id;
        const requesterId = (req as any).authUserId;
        if (!requesterId) return res.status(401).send('Not authenticated');

        // allow viewing own profile
        if (String(requesterId) === String(id)) {
            const query = { _id: new ObjectId(id) };
            const user = await collections?.users?.findOne(query);
            if (user) {
                const safe = { ...user } as any;
                delete safe.password_hash;
                return res.status(200).send(safe);
            }
            return res.status(404).send(`Failed to find a user: ID ${id}`);
        }

        // otherwise, only allow if requester is in the target user's amigos list
        const query = { _id: new ObjectId(id) };
        const user = await collections?.users?.findOne(query);
        if (!user) return res.status(404).send(`Failed to find a user: ID ${id}`);

        const amigos = user.amigos || [];
        const requesterObjId = new ObjectId(String(requesterId));
        console.log(`[Profile Access] Target: ${id}, Requester: ${requesterId}`);
        console.log(`[Profile Access] Target's amigos:`, amigos.map((a: any) => String(a?._id || a)));
        console.log(`[Profile Access] Requester as ObjectId:`, String(requesterObjId));
        
        const isFriend = (Array.isArray(amigos) && amigos.some((a: any) => {
            try {
                // compare string forms to handle ObjectId or string stored values
                const aStr = String(a?._id || a);
                const reqStr = String(requesterObjId);
                console.log(`[Profile Access] Comparing: ${aStr} === ${reqStr} => ${aStr === reqStr}`);
                return aStr === reqStr;
            } catch {
                return false;
            }
        }));

        console.log(`[Profile Access] isFriend result:`, isFriend);

        if (!isFriend) {
            return res.status(403).json({ message: 'Profile is private' });
        }

        const safe = { ...user } as any;
        delete safe.password_hash;
        return res.status(200).send(safe);
    } catch (error) {
        console.error(error);
        return res.status(400).send(`Failed to find a user: ID ${req?.params?.id}`);
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

// POST /signin-google - authenticate with Google token
userRouter.post("/signin-google", async (req: express.Request, res: express.Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).send("'token' is required");

        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        if (!GOOGLE_CLIENT_ID) return res.status(500).send("GOOGLE_CLIENT_ID is not configured");

        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload) return res.status(401).send("Invalid token");

        const { sub: googleId, email, name, picture } = payload;

        // Find or create user
        let user = await collections?.users?.findOne({ email: String(email).toLowerCase() });
        
        if (!user) {
            // Auto-create user on first Google login
            const newUser = {
                nombre: name || email?.split('@')[0] || 'Usuario',
                email: String(email).toLowerCase(),
                password_hash: '', // No password for OAuth users
                foto_perfil: picture || '',
                google_id: googleId,
                fecha_registro: new Date(),
                amigos: [],
                peticiones_amistad: [],
                preferencia_tema: 'light',
            };
            const result = await collections?.users?.insertOne(newUser as any);
            if (!result) return res.status(500).send("Failed to create user");
            user = await collections?.users?.findOne({ _id: result.insertedId });
        } else {
            // Update google_id if not present
            if (!(user as any).google_id) {
                await collections?.users?.updateOne(
                    { _id: (user as any)._id },
                    { $set: { google_id: googleId } }
                );
            }
        }

        if (!user) return res.status(500).send("Failed to retrieve user");

        // Generate JWT
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) return res.status(500).send("JWT_SECRET is not configured");

        const jwtToken = jwt.sign(
            { userId: (user as any)._id.toString(), email: (user as any).email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const safe = { ...user } as any;
        delete safe.password_hash;

        return res.status(200).json({ user: safe, token: jwtToken });
    } catch (err: any) {
        console.error('Google signin error:', err);
        return res.status(401).send(err.message || 'Invalid token');
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

        console.log(`[Friend Request] Received POST /users/${receiverId}/add-amigo with senderId:`, senderId);

        if (!senderId) {
            console.log('[Friend Request] Error: senderId missing from body');
            return res.status(400).send("'senderId' is required in the request body");
        }

        // Validar que receiverId es un ObjectId válido
        if (!ObjectId.isValid(receiverId)) {
            console.log('[Friend Request] Error: Invalid receiverId format:', receiverId);
            return res.status(400).json({ message: "ID de usuario inválido" });
        }

        // Validar que senderId es un ObjectId válido
        if (!ObjectId.isValid(senderId)) {
            console.log('[Friend Request] Error: Invalid senderId format:', senderId);
            return res.status(400).json({ message: "ID del remitente inválido" });
        }

        // Check if they're already friends
        const receiverObjId = new ObjectId(receiverId);
        const senderObjId = new ObjectId(senderId);
        const receiver = await collections?.users?.findOne({ _id: receiverObjId });
        
        if (!receiver) {
            console.log('[Friend Request] Error: Receiver not found with ID:', receiverId);
            return res.status(404).json({ message: "El usuario que intentas agregar no existe" });
        }

        // Verificar que el remitente también existe
        const sender = await collections?.users?.findOne({ _id: senderObjId });
        if (!sender) {
            console.log('[Friend Request] Error: Sender not found with ID:', senderId);
            return res.status(404).json({ message: "Tu usuario no existe en el sistema" });
        }

        console.log(`[Friend Request] Both users exist. Sender: ${sender.nombre} (${senderId}), Receiver: ${receiver.nombre} (${receiverId})`);

        // Check if already friends (try both ObjectId and string comparison)
        const alreadyFriends = await collections?.users?.findOne({
            _id: receiverObjId,
            $or: [
                { amigos: senderObjId as any },
                { amigos: senderObjId.toString() }
            ]
        });

        if (alreadyFriends) {
            console.log('[Friend Request] Error: Already friends');
            return res.status(400).json({ message: "Already friends with this user" });
        }

        // Check if request already exists (try both ObjectId and string comparison)
        const requestExists = await collections?.users?.findOne({
            _id: receiverObjId,
            $or: [
                { peticiones_amistad: senderObjId as any },
                { peticiones_amistad: senderObjId.toString() }
            ]
        });

        if (requestExists) {
            console.log('[Friend Request] Error: Request already exists');
            return res.status(400).json({ message: "Friend request already sent to this user" });
        }

        console.log('[Friend Request] Sending friend request...');
        const query = { _id: receiverObjId };
        const update = { $addToSet: { peticiones_amistad: senderObjId as any } }; // add sender ObjectId to peticiones_amistad array

        const result = await collections?.users?.updateOne(query, update, { bypassDocumentValidation: true });

        if (result && result.matchedCount) {
            // Check if the element was actually added (modifiedCount > 0)
            if (result.modifiedCount === 0) {
                // Element already existed, so this is a duplicate request
                console.log('[Friend Request] Error: Duplicate request detected');
                return res.status(400).json({ message: "Friend request already sent to this user" });
            }

            console.log('[Friend Request] Database update successful. Creating notification...');

            // Crear notificación para el receptor
            try {
                const notification = {
                    tipo: 'solicitud_amistad' as const,
                    de_usuario: senderObjId,
                    para_usuario: receiverObjId,
                    mensaje: `${sender.nombre || sender.email || 'Un usuario'} te ha enviado una solicitud de amistad`,
                    leida: false,
                    fecha: new Date(),
                };
                
                await collections?.notifications?.insertOne(notification as any);
                console.log('[Friend Request] Notification created successfully');
            } catch (notifError) {
                console.warn('[Friend Request] Error creating friendship notification:', notifError);
                // No fallar el endpoint si la notificación no se crea
            }

            console.log('[Friend Request] Friend request completed successfully');
            res.status(200).json({ message: `Friend request sent from ${senderId} to ${receiverId}` });
        } else {
            console.log('[Friend Request] Error: Database update failed');
            res.status(500).json({ message: `Failed to send friend request from ${senderId} to ${receiverId}` });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error('[Friend Request] Exception:', message);
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
            // Crear notificación para el remitente original (senderId) informando que su solicitud fue aceptada
            try {
                const receiver = await collections?.users?.findOne({ _id: receiverObjId });
                const receiverName = receiver?.nombre || receiver?.email || 'Un usuario';
                
                const notification = {
                    tipo: 'amistad_aceptada',
                    de_usuario: String(receiverId),
                    para_usuario: String(senderId),
                    id_grupo: '',
                    mensaje: `${receiverName} ha aceptado tu solicitud de amistad`,
                    leida: false,
                    fecha: new Date(),
                };
                
                await collections?.notifications?.insertOne(notification as any);
            } catch (notifError) {
                console.warn('Error creating friendship acceptance notification:', notifError);
                // No fallar el endpoint si la notificación no se crea
            }

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
            // If amigos contains ObjectIds or strings, fetch the corresponding user documents
            try {
                const ids = (Array.isArray(amigos) ? amigos : []).map((a: any) => {
                    try { return new ObjectId(String(a?._id || a)); } catch { return null; }
                }).filter(Boolean) as any[];

                if (ids.length === 0) {
                    return res.status(200).json({ amigos: [] });
                }

                const friends = await collections?.users?.find({ _id: { $in: ids } }).toArray();
                const safe = (friends || []).map((f: any) => {
                    const copy = { ...f };
                    delete copy.password_hash;
                    return copy;
                });
                return res.status(200).json({ amigos: safe });
            } catch (err) {
                // fallback: return the raw array
                console.error('Failed to populate amigos', err);
                return res.status(200).json({ amigos });
            }
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
            // Crear notificación para el remitente original (senderId) informando que su solicitud fue rechazada
            try {
                const receiver = await collections?.users?.findOne({ _id: new ObjectId(receiverId) });
                const receiverName = receiver?.nombre || receiver?.email || 'Un usuario';
                
                const notification = {
                    tipo: 'amistad_rechazada',
                    de_usuario: String(receiverId),
                    para_usuario: String(senderId),
                    id_grupo: '',
                    mensaje: `${receiverName} ha rechazado tu solicitud de amistad`,
                    leida: false,
                    fecha: new Date(),
                };
                
                await collections?.notifications?.insertOne(notification as any);
            } catch (notifError) {
                console.warn('Error creating friendship rejection notification:', notifError);
                // No fallar el endpoint si la notificación no se crea
            }

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
