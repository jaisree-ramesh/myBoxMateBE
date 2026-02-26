import { Request, Response } from "express";
import { Item } from "../models/item";
import QRCode from "qrcode";

export const createItem = async (req: any, res: Response) => {
  try {
    const { name, desc, parentId, box, collaborators } = req.body;
    const owner = req.user._id;
    const imageUrl = req.file?.path;

    const item = await Item.create({
      name,
      desc,
      owner,
      parentId: parentId || null,
      box: box || null, // ← which box this item lives in
      createdBy: owner,
      collaborators: collaborators || [],
      image: imageUrl || null,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const qrUrl = `${frontendBaseUrl}/item/${item._id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    item.qrCode = qrDataUrl;
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    console.error("Create Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getItems = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getItemById = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const { name, desc, parentId, box, collaborators } = req.body;
    if (name !== undefined) item.name = name;
    if (desc !== undefined) item.desc = desc;
    if (parentId !== undefined) item.parentId = parentId;
    if (box !== undefined) item.box = box; // ← update box too
    if (collaborators !== undefined) item.collaborators = collaborators;
    if (req.file?.path) item.image = req.file.path;

    item.editedBy = userId;

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const qrUrl = `${frontendBaseUrl}/item/${item._id}`;
    item.qrCode = await QRCode.toDataURL(qrUrl);

    await item.save();
    res.json(item);
  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    if (!item) return res.status(404).json({ message: "Item not found" });
    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getItemsByParentId = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({
      parentId: req.params.parentId,
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* import { Request, Response } from "express";
import { Item } from "../models/item";
import QRCode from "qrcode";

export const createItem = async (req: any, res: Response) => {
  try {
    const { name, desc, parentId, collaborators } = req.body; // collaborators optional array of user IDs
    const owner = req.user._id;
    const imageUrl = req.file?.path;

    // Create item
    const item = await Item.create({
      name,
      desc,
      owner,
      parentId: parentId || null,
      createdBy: owner,
      collaborators: collaborators || [],
      image: imageUrl || null,
    });

    // Generate QR code
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const qrUrl = `${frontendBaseUrl}/item/${item._id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    item.qrCode = qrDataUrl;
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    console.error("Create Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all items the user has access to (owner or collaborator)
export const getItems = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({
      $or: [{ owner: userId }, { collaborators: userId }],
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get item by ID (only if owner or collaborator)
export const getItemById = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update item (only owner or collaborator)
export const updateItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;

    // Only owner or collaborators can update
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    // Update fields from request body
    const { name, desc, parentId, collaborators } = req.body;
    if (name !== undefined) item.name = name;
    if (desc !== undefined) item.desc = desc;
    if (parentId !== undefined) item.parentId = parentId;
    if (collaborators !== undefined) item.collaborators = collaborators;

    // Update image if file uploaded
    if (req.file?.path) item.image = req.file.path;

    // Update who edited
    item.editedBy = userId;

    // Regenerate QR code
    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const qrUrl = `${frontendBaseUrl}/item/${item._id}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl);
    item.qrCode = qrDataUrl;

    await item.save();

    res.json(item);
  } catch (error) {
    console.error("Update Item Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Delete item (only owner or collaborator if you allow)
export const deleteItem = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const item = await Item.findOne({
      _id: req.params.id,
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Get item by parent ID (only if owner or collaborator)
export const getItemsByParentId = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const items = await Item.find({
      parentId: req.params.parentId,
      $or: [{ owner: userId }, { collaborators: userId }],
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
 */
