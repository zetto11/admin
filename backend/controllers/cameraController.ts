import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { db } from "../config/db";
import { Server } from "socket.io";

export const getCameras = async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        c.id,
        c.name,
        c.zone,
        c.ip_simulated,
        c.status,
        c.is_blocked,
        c.last_seen,
        ct.signal_percent,
        ct.uptime_hours,
        ct.thermal_celsius,
        ct.load_percent,
        ct.retain_days_remaining,
        ct.storage_used_tb,
        ct.storage_node_label,
        ct.updated_at AS telemetry_updated_at
      FROM cameras c
      LEFT JOIN camera_telemetry ct ON ct.camera_id = c.id
      ORDER BY c.id DESC`
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const blockCamera = (io: Server) => async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { blocked } = req.body;
  try {
    await db.execute("UPDATE cameras SET is_blocked = ? WHERE id = ?", [blocked ? 1 : 0, id]);
    await db.execute(
      "INSERT INTO access_logs (user_id, camera_id, action) VALUES (?, ?, ?)",
      [req.user?.id, id, blocked ? "block" : "unblock"]
    );

    io.emit("camera_update", { id, is_blocked: !!blocked });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
