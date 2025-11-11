import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectToDatabase } from "./database";
import { userRouter } from "./routes/users.route";
import { userGroupRouter } from "./routes/user-group.route";
import { participacionRouter } from "./routes/participacion.route";
import { GastosRouter } from "./routes/gastos.route";


// Load environment variables from the .env file, where the ATLAS_URI is configured
dotenv.config();

const { ATLAS_URI } = process.env;

if (!ATLAS_URI) {
  console.error(
    "No ATLAS_URI environment variable has been defined in config.env"
  );
  process.exit(1);
}

connectToDatabase(ATLAS_URI)
  .then(() => {
    const app = express();
  app.use(cors());
  // parse JSON bodies
  app.use(express.json());
  // parse URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
  app.use("/users", userRouter);
  // mount additional routers for groups and participations
  app.use("/user-group", userGroupRouter);
  app.use("/participacion", participacionRouter);
  // mount gastos router
  app.use("/gastos", GastosRouter);

    // start the Express server
    app.listen(5200, () => {
      console.log(`Server running at http://localhost:5200...`);
    });
  })
  .catch((error) => console.error(error));
