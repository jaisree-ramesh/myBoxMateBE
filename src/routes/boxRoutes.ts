import express, { Response } from "express";
import { Box, IBox } from "../models/box";
import { Item } from "../models/item";
import { protect, AuthRequest } from "../middleware/authMiddleware";
import { Types } from "mongoose";

const router = express.Router();

router.use(protect);

// ── GET /api/boxes?parentId=<spaceId> ────────────────────────────────────────
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { parentId } = req.query;

    const filter: Record<string, unknown> = { owner: req.user._id };
    if (parentId) filter.parentId = parentId;

    const boxes = await Box.find(filter).sort({ createdAt: 1 });

    res.json(
      boxes.map((b) => ({
        id: (b._id as Types.ObjectId).toString(),
        name: b.name,
        desc: b.desc,
        icon: b.icon,
        color: b.color,
        parentId: (b.parentId as Types.ObjectId).toString(),
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    );
  } catch {
    res.status(500).json({ message: "Failed to fetch boxes" });
  }
});

// ── POST /api/boxes ──────────────────────────────────────────────────────────
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, desc, icon, color, parentId } = req.body;

    if (!name?.trim())
      return res.status(400).json({ message: "Box name is required" });
    if (!parentId)
      return res.status(400).json({ message: "parentId (space) is required" });

    const box = await Box.create({
      name: name.trim(),
      desc,
      icon: icon ?? "📦",
      color: color ?? "#D97706",
      parentId,
      owner: req.user._id,
    });

    res.status(201).json({
      id: (box._id as Types.ObjectId).toString(),
      name: box.name,
      desc: box.desc,
      icon: box.icon,
      color: box.color,
      parentId: (box.parentId as Types.ObjectId).toString(),
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to create box" });
  }
});

// ── PATCH /api/boxes/:id ─────────────────────────────────────────────────────
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const box = await Box.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: req.body },
      { new: true },
    );

    if (!box) return res.status(404).json({ message: "Box not found" });

    res.json({
      id: (box._id as Types.ObjectId).toString(),
      name: box.name,
      desc: box.desc,
      icon: box.icon,
      color: box.color,
      parentId: (box.parentId as Types.ObjectId).toString(),
      updatedAt: box.updatedAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to update box" });
  }
});

// ── DELETE /api/boxes/:id ────────────────────────────────────────────────────
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const box = await Box.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!box) return res.status(404).json({ message: "Box not found" });

    await Item.deleteMany({ parentId: box._id });
    await box.deleteOne();

    res.json({ message: "Box deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete box" });
  }
});

export default router;
