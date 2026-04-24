import express from "express";
import { createServer } from "http";
import { Server } from "../frontend/node_modules/socket.io/dist/index.js";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { connectToDatabase, db } from "./config/db";
import { authenticateToken, isAdmin } from "./middleware/authMiddleware";
import authRoutes from "./routes/authRoutes";
import createCameraRouter from "./routes/cameraRoutes";
import alertRoutes from "./routes/alertRoutes";
import logRoutes from "./routes/logRoutes";
import systemRoutes from "./routes/systemRoutes";
import { getSystemStatus, getAccessPoints, getUsers } from "./controllers/systemController";

dotenv.config();

const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, decimals = 2) =>
  Number((Math.random() * (max - min) + min).toFixed(decimals));

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
  app.use("/cam_screens", express.static(path.resolve(process.cwd(), "cam_screens")));

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

  const runTelemetryCycle = async () => {
    try {
      const [rows]: any = await db.execute(
        `SELECT c.id, c.zone, c.status, ct.uptime_hours, ct.signal_percent, ct.thermal_celsius, ct.load_percent,
                ct.retain_days_remaining, ct.storage_used_tb, ct.storage_node_label
         FROM cameras c
         LEFT JOIN camera_telemetry ct ON ct.camera_id = c.id`
      );

      for (const cam of rows) {
        const zoneKey = String(cam.zone || "").toLowerCase();
        const signalRange = zoneKey === "factory" ? [60, 88] : zoneKey === "warehouse" ? [65, 92] : [72, 100];
        const thermalRange = zoneKey === "factory" ? [50, 80] : [35, 65];
        const currentUptime = Number(cam.uptime_hours ?? 0);
        const uptimeHours = cam.status === "online"
          ? Number((currentUptime + randFloat(0.003, 0.008, 3)).toFixed(3))
          : 0;
        const nextStorage = Math.min(0.02, Math.max(0.0005, Number(cam.storage_used_tb ?? 0.0005) + randFloat(0.00001, 0.0003, 5)));

        await db.execute(
          `INSERT INTO camera_telemetry
          (camera_id, signal_percent, uptime_hours, thermal_celsius, load_percent, retain_days_remaining, storage_used_tb, storage_node_label)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            signal_percent = VALUES(signal_percent),
            uptime_hours = VALUES(uptime_hours),
            thermal_celsius = VALUES(thermal_celsius),
            load_percent = VALUES(load_percent),
            retain_days_remaining = VALUES(retain_days_remaining),
            storage_used_tb = VALUES(storage_used_tb),
            storage_node_label = VALUES(storage_node_label),
            updated_at = CURRENT_TIMESTAMP`,
          [
            cam.id,
            randInt(signalRange[0], signalRange[1]),
            uptimeHours,
            randFloat(thermalRange[0], thermalRange[1], 2),
            randInt(10, 90),
            Math.max(7, Number(cam.retain_days_remaining ?? randInt(7, 30)) - (Math.random() > 0.95 ? 1 : 0)),
            Number(nextStorage.toFixed(4)),
            cam.storage_node_label || `Sigma-${randInt(1, 9)}`,
          ]
        );
      }
    } catch {
      // keep telemetry simulation fault-tolerant
    } finally {
      const nextMs = randInt(10000, 30000);
      setTimeout(runTelemetryCycle, nextMs);
    }
  };

  setTimeout(runTelemetryCycle, randInt(10000, 30000));

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
