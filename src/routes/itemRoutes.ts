import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/itemController";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

router.use(protect); // all routes require authentication

router.post("/", protect, upload.single("image"), createItem);
router.put("/:id", upload.single("image"), updateItem);

router.get("/", getItems);
router.get("/:id", getItemById);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export default router;
