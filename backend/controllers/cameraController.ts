import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { db } from "../config/db";
import { Server } from "socket.io";
import fs from "fs/promises";
import path from "path";

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

export const createCamera = async (req: AuthRequest, res: Response) => {
  const { name, ip_simulated, zone } = req.body || {};
  if (!name || !ip_simulated || !zone) {
    return res.status(400).json({ error: "name, ip_simulated and zone are required" });
  }
  if (!String(ip_simulated).toLowerCase().startsWith("http")) {
    return res.status(400).json({ error: "ip_simulated must start with http" });
  }

  try {
    const [result]: any = await db.execute(
      "INSERT INTO cameras (name, ip_simulated, zone, status, is_blocked) VALUES (?, ?, ?, 'offline', false)",
      [name, ip_simulated, zone]
    );
    return res.status(201).json({ success: true, id: result.insertId });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
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

export const captureCameraFrame = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await db.execute(
      "SELECT id, name, ip_simulated FROM cameras WHERE id = ? LIMIT 1",
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const camera = rows[0];
    const streamUrl = String(camera.ip_simulated || "");
    const snapshotUrl = /\/video$/i.test(streamUrl)
      ? streamUrl.replace(/\/video$/i, "/shot.jpg")
      : streamUrl;

    const response = await fetch(snapshotUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      return res.status(502).json({ error: `Snapshot request failed (${response.status})` });
    }

    const contentType = response.headers.get("content-type") || "";
    const ext = contentType.includes("png") ? "png" : "jpg";
    const bytes = Buffer.from(await response.arrayBuffer());

    const screenshotsDir = path.resolve(process.cwd(), "cam_screens");
    await fs.mkdir(screenshotsDir, { recursive: true });

    const safeName = String(camera.name).replace(/[^a-z0-9-_]+/gi, "_");
    const fileName = `${safeName}_${camera.id}_${Date.now()}.${ext}`;
    const fullPath = path.join(screenshotsDir, fileName);
    await fs.writeFile(fullPath, bytes);

    return res.json({
      success: true,
      file_name: fileName,
      file_path: fullPath,
      public_path: `/cam_screens/${fileName}`,
      source_url: snapshotUrl
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const runVectorAnalysis = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const [rows]: any = await db.execute(
      `SELECT c.id, c.name, c.status, c.is_blocked, ct.signal_percent, ct.load_percent, ct.thermal_celsius
       FROM cameras c
       LEFT JOIN camera_telemetry ct ON ct.camera_id = c.id
       WHERE c.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const cam = rows[0];
    const signal = Number(cam.signal_percent ?? 0);
    const load = Number(cam.load_percent ?? 0);
    const thermal = Number(cam.thermal_celsius ?? 0);

    let riskScore = 10;
    if (cam.status !== "online") riskScore += 40;
    if (cam.is_blocked) riskScore += 20;
    if (signal > 0 && signal < 60) riskScore += 20;
    if (load > 85) riskScore += 15;
    if (thermal > 70) riskScore += 15;
    riskScore = Math.min(100, riskScore);

    const severity = riskScore >= 75 ? "high" : riskScore >= 45 ? "medium" : "low";
    const summary = severity === "high"
      ? "Vector instability detected. Immediate operator review recommended."
      : severity === "medium"
        ? "Minor vector deviations detected. Monitor this node closely."
        : "Vector profile stable. No immediate anomalies detected.";

    return res.json({
      success: true,
      camera_id: cam.id,
      camera_name: cam.name,
      risk_score: riskScore,
      severity,
      summary,
      inputs: {
        status: cam.status,
        is_blocked: !!cam.is_blocked,
        signal_percent: cam.signal_percent,
        load_percent: cam.load_percent,
        thermal_celsius: cam.thermal_celsius
      },
      analyzed_at: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
