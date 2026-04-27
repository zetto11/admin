import express from "express";
import { getAlerts, acknowledgeAlert, acknowledgeAllAlerts, purgeAlerts } from "../controllers/alertController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/", authenticateToken, getAlerts);
router.post("/:id/acknowledge", authenticateToken, acknowledgeAlert);
router.post("/acknowledge-all", authenticateToken, isAdmin, acknowledgeAllAlerts);
router.delete("/", authenticateToken, isAdmin, purgeAlerts);

export default router;
