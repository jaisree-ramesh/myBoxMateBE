import express from "express";
import mongoose from "mongoose";
import { Item } from "../models/item";
import { protect } from "../middleware/authMiddleware";
import { acceptedCollaboratorIds } from "../services/starterSpaces";
import { spaceUpload } from "../middleware/uploadMiddleware";

const router = express.Router();
router.use(protect);

const access = (userId: string) => ({
  $or: [{ owner: userId }, { collaborators: userId }],
});

router.get("/spaces", async (req: any, res) => {
  const rows = await Item.find({
    kind: "space",
    ...access(req.user._id.toString()),
  });
  res.json(
    rows.map((space) => ({
      id: String(space._id),
      alt: space.name,
      image: space.image ?? "",
    })),
  );
});

router.post(
  "/spaces/upload-image",
  spaceUpload.single("image"),
  (req: any, res) => {
    if (!req.file?.path)
      return res.status(400).json({ message: "An image file is required" });
    res.status(201).json({ imageUrl: req.file.path });
  },
);

router.post("/spaces", async (req: any, res) => {
  const name = String(req.body.alt ?? req.body.name ?? "").trim();
  if (!name) return res.status(400).json({ message: "Space name is required" });
  const collaborators = await acceptedCollaboratorIds(req.user._id);
  const space = await Item.create({
    name,
    image: req.body.image ?? "",
    kind: "space",
    owner: req.user._id,
    createdBy: req.user._id,
    collaborators,
  });
  res
    .status(201)
    .json({ id: String(space._id), alt: space.name, image: space.image ?? "" });
});

router.patch("/spaces/:id", async (req: any, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid space ID" });
  }

  const space = await Item.findOne({
    _id: req.params.id,
    kind: "space",
    ...access(req.user._id.toString()),
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (req.body.name !== undefined) {
    if (typeof req.body.name !== "string" || !req.body.name.trim()) {
      return res.status(400).json({ message: "Space name cannot be empty" });
    }
    space.name = req.body.name.trim();
  }

  if (req.body.image !== undefined) {
    if (typeof req.body.image !== "string") {
      return res.status(400).json({ message: "Invalid space image" });
    }
    space.image = req.body.image;
  }

  if (req.body.name === undefined && req.body.image === undefined) {
    return res
      .status(400)
      .json({ message: "Provide a space name or image to update" });
  }

  await space.save();

  res.json({
    id: String(space._id),
    alt: space.name,
    image: space.image ?? "",
  });
});

router.delete("/spaces/:id", async (req: any, res) => {
  const space = await Item.findOne({
    _id: req.params.id,
    kind: "space",
    ...access(req.user._id.toString()),
  });
  if (!space) return res.status(404).json({ message: "Space not found" });
  const boxIds = await Item.find({ parentId: space._id, kind: "box" }).distinct(
    "_id",
  );
  await Item.deleteMany({ parentId: { $in: [space._id, ...boxIds] } });
  await space.deleteOne();
  res.json({ message: "Space deleted" });
});

router.get("/boxes", async (req: any, res) => {
  const filter: any = { kind: "box", ...access(req.user._id.toString()) };
  if (typeof req.query.parentId === "string")
    filter.parentId = req.query.parentId;
  const rows = await Item.find(filter);
  res.json(
    rows.map((box) => ({
      ...box.toObject(),
      id: String(box._id),
      _id: String(box._id),
      parentId: box.parentId?.toString(),
    })),
  );
});

router.post("/boxes", async (req: any, res) => {
  const { name, desc, parentId, icon, color } = req.body;
  if (!name?.trim() || !mongoose.isValidObjectId(parentId))
    return res
      .status(400)
      .json({ message: "Valid space and box name are required" });
  const parent = await Item.findOne({
    _id: parentId,
    kind: "space",
    ...access(req.user._id.toString()),
  });
  if (!parent) return res.status(404).json({ message: "Space not found" });
  const box = await Item.create({
    name: name.trim(),
    desc,
    parentId,
    icon,
    color,
    kind: "box",
    owner: parent.owner,
    createdBy: req.user._id,
    collaborators: parent.collaborators,
  });
  res.status(201).json({
    ...box.toObject(),
    id: String(box._id),
    _id: String(box._id),
    parentId: box.parentId?.toString(),
  });
});
router.patch("/boxes/:id", async (req: any, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid box ID" });
  }

  const box = await Item.findOne({
    _id: req.params.id,
    kind: "box",
    ...access(req.user._id.toString()),
  });

  if (!box) {
    return res.status(404).json({ message: "Box not found" });
  }

  const { name, desc, icon, color } = req.body;

  if (name !== undefined) {
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Box name cannot be empty" });
    }
    box.name = name.trim();
  }

  if (desc !== undefined) box.desc = desc;
  if (icon !== undefined) box.icon = icon;
  if (color !== undefined) box.color = color;

  await box.save();

  res.json({
    ...box.toObject(),
    id: String(box._id),
    _id: String(box._id),
    parentId: box.parentId?.toString(),
  });
});

router.delete("/boxes/:id", async (req: any, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid box ID" });
  }

  const box = await Item.findOne({
    _id: req.params.id,
    kind: "box",
    ...access(req.user._id.toString()),
  });

  if (!box) {
    return res.status(404).json({ message: "Box not found" });
  }

  // Keep the products; remove their box assignment.
  await Item.updateMany({ box: box._id }, { $unset: { box: 1 } });

  // Move any legacy child items into the box's parent space.
  await Item.updateMany(
    { parentId: box._id, kind: "item" },
    { $set: { parentId: box.parentId }, $unset: { box: 1 } },
  );

  await box.deleteOne();

  res.json({ message: "Box deleted; its items were kept in the space" });
});

export default router;
