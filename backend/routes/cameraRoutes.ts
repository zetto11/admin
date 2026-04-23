import express from "express";
import { getCameras, blockCamera } from "../controllers/cameraController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";
import { Server } from "socket.io";

const createCameraRouter = (io: Server) => {
  const router = express.Router();

  router.get("/", authenticateToken, getCameras);
  router.post("/:id/block", authenticateToken, isAdmin, blockCamera(io));

  return router;
};

export default createCameraRouter;
