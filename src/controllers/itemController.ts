import { Response } from "express";
import { Item } from "../models/item";
import QRCode from "qrcode";
import mongoose from "mongoose";

export const createItem = async (req: any, res: Response) => {
  try {
    const { name, desc, parentId, icon, color, box } = req.body;
    const createdBy = req.user._id;
    const imageUrl = req.file?.path;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Item name is required" });
    }

    if (!mongoose.isValidObjectId(parentId)) {
      return res.status(400).json({ message: "A valid space is required" });
    }

    const space = await Item.findOne({
      _id: parentId,
      kind: "space",
      $or: [{ owner: createdBy }, { collaborators: createdBy }],
    });

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    let boxId: mongoose.Types.ObjectId | undefined;

    if (box && String(box) !== String(space._id)) {
      if (!mongoose.isValidObjectId(box)) {
        return res.status(400).json({ message: "Invalid box" });
      }

      const parentBox = await Item.findOne({
        _id: box,
        kind: "box",
        parentId: space._id,
        $or: [{ owner: createdBy }, { collaborators: createdBy }],
      });

      if (!parentBox) {
        return res.status(404).json({ message: "Box not found" });
      }

      boxId = parentBox._id as mongoose.Types.ObjectId;
    }

    const item = await Item.create({
      name: name.trim(),
      desc,
      owner: space.owner,
      parentId: space._id,
      createdBy,
      collaborators: space.collaborators,
      image: imageUrl || null,
      kind: "item",
      icon,
      color,
      box: boxId,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    item.qrCode = await QRCode.toDataURL(`${frontendBaseUrl}/item/${item._id}`);
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    console.error("Create Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all products the user owns or can access as a collaborator.
export const getItems = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({
      kind: "item",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    res.json(items);
  } catch (error) {
    console.error("Get Items Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get one product, only if the user owns it or is a collaborator.
export const getItemById = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      kind: "item",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Get Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a product, only if the user owns it or is a collaborator.
export const updateItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      kind: "item",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const targetSpaceId = req.body.parentId ?? item.parentId;

    if (!mongoose.isValidObjectId(targetSpaceId)) {
      return res.status(400).json({ message: "A valid space is required" });
    }

    const space = await Item.findOne({
      _id: targetSpaceId,
      kind: "space",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    const spaceChanged = String(item.parentId) !== String(space._id);
    const requestedBox =
      req.body.box !== undefined
        ? req.body.box
        : spaceChanged
          ? undefined
          : item.box;

    let boxId: mongoose.Types.ObjectId | undefined;

    if (requestedBox && String(requestedBox) !== String(space._id)) {
      if (!mongoose.isValidObjectId(requestedBox)) {
        return res.status(400).json({ message: "Invalid box" });
      }

      const box = await Item.findOne({
        _id: requestedBox,
        kind: "box",
        parentId: space._id,
        $or: [{ owner: userId }, { collaborators: userId }],
      });

      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }

      boxId = box._id as mongoose.Types.ObjectId;
    }

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim()) {
        return res.status(400).json({ message: "Item name cannot be empty" });
      }
      item.name = req.body.name.trim();
    }

    if (req.body.desc !== undefined) item.desc = req.body.desc;
    if (req.body.icon !== undefined) item.icon = req.body.icon;
    if (req.body.color !== undefined) item.color = req.body.color;

    item.parentId = space._id as mongoose.Types.ObjectId;
    item.box = boxId;
    item.owner = space.owner;
    item.editedBy = userId;

    if (spaceChanged) {
      item.collaborators = space.collaborators;
    }

    // Only the item owner can change its explicit collaborator list.
    if (
      req.body.collaborators !== undefined &&
      item.owner.toString() === userId.toString() &&
      Array.isArray(req.body.collaborators)
    ) {
      item.collaborators = req.body.collaborators;
    }

    if (req.file?.path) {
      item.image = req.file.path;
    } else if (req.body.image !== undefined) {
      item.image = req.body.image;
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    item.qrCode = await QRCode.toDataURL(`${frontendBaseUrl}/item/${item._id}`);

    await item.save();
    res.json(item);
  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a product, only if the user owns it or is a collaborator.
export const deleteItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }

    const item = await Item.findOne({
      _id: req.params.id,
      kind: "item",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get products in a parent space, only if the user can access that space.
export const getItemsByParentId = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const { parentId } = req.params;

    if (!mongoose.isValidObjectId(parentId)) {
      return res.status(400).json({ message: "Invalid parent ID" });
    }

    const space = await Item.findOne({
      _id: parentId,
      kind: "space",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!space) {
      return res.status(404).json({ message: "Space not found" });
    }

    const items = await Item.find({
      parentId: space._id,
      kind: "item",
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    res.json(items);
  } catch (error) {
    console.error("Get Items By Parent Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
