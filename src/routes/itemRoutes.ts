import express from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
  getItemsByParentId,
} from "../controllers/itemController";
import { upload } from "../middleware/uploadMiddleware";

const router = express.Router();

router.use(protect);

router.post("/", upload.single("image"), createItem);
router.get("/", getItems);
router.get("/by-parent/:parentId", getItemsByParentId);
router.get("/:id", getItemById);
router.put("/:id", upload.single("image"), updateItem);
router.delete("/:id", deleteItem);

export default router;
