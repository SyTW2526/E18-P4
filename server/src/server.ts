import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { connectToDatabase } from "./database";
import { userRouter } from "./routes/users.route";
import { sharedAccountsRouter } from "./routes/shared-account.route";
import { GastosRouter } from "./routes/gastos.route";
import { participacionRouter } from "./routes/participacion.route";
import { userGroupRouter } from "./routes/user-group.route";

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
  app.use(express.json());
  app.use(cors());
  app.use("/users", userRouter);
  app.use("/shared_accounts", sharedAccountsRouter);
  app.use("/user_groups", userGroupRouter);
  app.use("/gastos", GastosRouter);
  app.use("/participaciones", participacionRouter);

    // start the Express server
    app.listen(5200, () => {
      console.log(`Server running at http://localhost:5200...`);
    });
  })
  .catch((error) => console.error(error));
