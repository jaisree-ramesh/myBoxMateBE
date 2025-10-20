import express from "express";
import {
  sendRequest,
  respondToRequest,
  getRequests,
} from "../controllers/collaboratorController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send", protect, sendRequest);
router.post("/:requestId/respond", protect, respondToRequest);
router.get("/my-requests", protect, getRequests);

export default router;
