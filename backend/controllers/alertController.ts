import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { db } from "../config/db";

const normalizeSeverity = (severity: string): "low" | "medium" | "high" => {
  if (severity === "critical") return "high";
  if (severity === "medium") return "medium";
  if (severity === "low") return "low";
  return "high";
};

export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const [rows]: any = await db.execute(`
      SELECT 
        a.id,
        a.type,
        a.severity,
        a.description,
        a.timestamp,
        COALESCE(a.is_acknowledged, 0) as is_acknowledged,
        a.explanation,
        COALESCE(a.affected_entity, c.name, CONCAT('CAM-', a.camera_id), 'SYSTEM_CORE') as affected_entity
      FROM alerts a
      LEFT JOIN cameras c ON c.id = a.camera_id
      ORDER BY timestamp DESC
      LIMIT 50
    `);

    const normalizedRows = rows.map((row: any) => ({
      ...row,
      severity: normalizeSeverity(row.severity),
      is_acknowledged: Boolean(row.is_acknowledged),
    }));

    res.json(normalizedRows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const acknowledgeAlert = async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid alert id" });
    }

    const [result]: any = await db.execute(
      "UPDATE alerts SET is_acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: "Alert not found" });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const acknowledgeAllAlerts = async (req: AuthRequest, res: Response) => {
  try {
    await db.execute(
      "UPDATE alerts SET is_acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP WHERE COALESCE(is_acknowledged, 0) = 0"
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const purgeAlerts = async (req: AuthRequest, res: Response) => {
  try {
    const scope = req.query.scope === "all" ? "all" : "acknowledged";

    if (scope === "all") {
      await db.execute("DELETE FROM alerts");
      return res.json({ success: true, deleted: "all" });
    }

    await db.execute("DELETE FROM alerts WHERE COALESCE(is_acknowledged, 0) = 1");
    return res.json({ success: true, deleted: "acknowledged" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
