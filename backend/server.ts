import express from "express";
import { createServer } from "http";
import { Server } from "../frontend/node_modules/socket.io/dist/index.js";
import cors from "cors";
import dotenv from "dotenv";

import { connectToDatabase, db } from "./config/db";
import { authenticateToken, isAdmin } from "./middleware/authMiddleware";
import authRoutes from "./routes/authRoutes";
import createCameraRouter from "./routes/cameraRoutes";
import alertRoutes from "./routes/alertRoutes";
import logRoutes from "./routes/logRoutes";
import systemRoutes from "./routes/systemRoutes";
import { getSystemStatus, getAccessPoints, getUsers } from "./controllers/systemController";

dotenv.config();

async function startServer() {
  const isDbConnected = await connectToDatabase().catch((err) => {
    console.error("Database connection failed during startup:", err.message);
    return false;
  });

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  app.use(cors());
  app.use(express.json());

  app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
  });

  app.get("/api/health", (_req, res) => res.json({
    status: "alive",
    dbConnected: isDbConnected
  }));

  app.use("/api/auth", authRoutes);
  app.use("/api/cameras", createCameraRouter(io));
  app.use("/api/alerts", alertRoutes);
  app.use("/api/logs", logRoutes);
  app.use("/api/system", systemRoutes);

  app.use("/api", authRoutes);
  app.get("/api/system-status", authenticateToken, getSystemStatus);
  app.get("/api/access-points", authenticateToken, getAccessPoints);
  app.get("/api/users", authenticateToken, isAdmin, getUsers);

  setInterval(async () => {
    try {
      const [cameras]: any = await db.execute("SELECT id, status FROM cameras");
      for (const cam of cameras) {
        if (Math.random() < 0.05) {
          const newStatus = cam.status === "online" ? "offline" : "online";
          await db.execute("UPDATE cameras SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?", [newStatus, cam.id]);
          io.emit("camera_update", { id: cam.id, status: newStatus });

          if (newStatus === "offline") {
            const [result]: any = await db.execute(
              "INSERT INTO alerts (type, severity, description, camera_id) VALUES (?, ?, ?, ?)",
              ["system", "high", `Security node CAM-${cam.id} lost connectivity`, cam.id]
            );

            io.emit("new_alert", {
              id: result.insertId,
              type: "system",
              severity: "high",
              description: `Security node CAM-${cam.id} lost connectivity`,
              timestamp: new Date().toISOString(),
              is_acknowledged: false
            });
          }
        }
      }
    } catch (_e) {
      // keep simulation fault-tolerant
    }
  }, 5000);

  const PORT = Number(process.env.PORT || 3000);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`\n--- SOC BACKEND API ONLINE ---`);
    console.log(`Port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Database: ${isDbConnected ? "CONNECTED" : "DISCONNECTED"}`);
    console.log(`-------------------------------\n`);
  });
}

startServer();
