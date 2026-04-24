import express from "express";
import { getCameras, createCamera, discoverCameras, blockCamera, captureCameraFrame, runVectorAnalysis } from "../controllers/cameraController";
import { authenticateToken, isAdmin } from "../middleware/authMiddleware";
import { Server } from "socket.io";

const createCameraRouter = (io: Server) => {
  const router = express.Router();

  router.get("/", authenticateToken, getCameras);
  router.get("/discover", authenticateToken, discoverCameras);
  router.post("/", authenticateToken, isAdmin, createCamera);
  router.post("/:id/block", authenticateToken, isAdmin, blockCamera(io));
  router.post("/:id/capture", authenticateToken, captureCameraFrame);
  router.post("/:id/vector-analysis", authenticateToken, runVectorAnalysis);

  return router;
};

export default createCameraRouter;
