import express from "express";
import {
  sendRequest,
  respondToRequest,
  getRequests,
  removeCollaborator,
  getCollaborators,
  removeCollaboratorByEmail,
} from "../controllers/collaboratorController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/send", protect, sendRequest);
router.post("/:requestId/respond", protect, respondToRequest);
router.get("/my-requests", protect, getRequests);
router.get("/", protect, getCollaborators); 
router.delete("/:id", protect, removeCollaborator); 
router.post("/remove", protect, removeCollaboratorByEmail);


export default router;
