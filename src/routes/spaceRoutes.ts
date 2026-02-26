import express, { Response } from "express";
import { Types } from "mongoose";
import { Space } from "../models/space";
import { Box } from "../models/box";
import { Item } from "../models/item";
import { protect, AuthRequest } from "../middleware/authMiddleware";

const router = express.Router();

router.use(protect);

// ── GET /api/spaces ──────────────────────────────────────────────────────────
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const spaces = await Space.find({ owner: req.user._id }).sort({
      createdAt: 1,
    });

    res.json(
      spaces.map((s) => ({
        id: (s._id as Types.ObjectId).toString(),
        alt: s.alt,
        image: s.image ?? "",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    );
  } catch {
    res.status(500).json({ message: "Failed to fetch spaces" });
  }
});

// ── POST /api/spaces ─────────────────────────────────────────────────────────
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { alt, image } = req.body;

    if (!alt?.trim())
      return res.status(400).json({ message: "Space name is required" });

    const space = await Space.create({
      name: alt.trim(),
      alt: alt.trim(),
      image: image ?? "",
      owner: req.user._id,
    });

    res.status(201).json({
      id: (space._id as Types.ObjectId).toString(),
      alt: space.alt,
      image: space.image ?? "",
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to create space" });
  }
});

// ── PATCH /api/spaces/:id ────────────────────────────────────────────────────
router.patch("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const space = await Space.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: req.body },
      { new: true },
    );

    if (!space) return res.status(404).json({ message: "Space not found" });

    res.json({
      id: (space._id as Types.ObjectId).toString(),
      alt: space.alt,
      image: space.image ?? "",
      updatedAt: space.updatedAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to update space" });
  }
});

// ── DELETE /api/spaces/:id ───────────────────────────────────────────────────
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const space = await Space.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!space) return res.status(404).json({ message: "Space not found" });

    const spaceId = space._id as Types.ObjectId;

    // 1. Find all boxes in this space
    const boxes = await Box.find({ parentId: spaceId });
    const boxIds = boxes.map((b) => b._id as Types.ObjectId);

    // 2. Delete all items in those boxes + items directly under the space
    await Item.deleteMany({ parentId: { $in: [spaceId, ...boxIds] } });

    // 3. Delete all boxes
    await Box.deleteMany({ parentId: spaceId });

    // 4. Delete the space itself
    await space.deleteOne();

    res.json({ message: "Space deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete space" });
  }
});

export default router;
