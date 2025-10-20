import { Request, Response } from "express";
import { Item } from "../models/item";
import QRCode from "qrcode";

export const createItem = async (req: any, res: Response) => {
  try {
    const { name, desc, parentId } = req.body;
    const owner = req.user._id;
    const imageUrl = req.file?.path;

    const item = await Item.create({
      name,
      desc,
      owner,
      parentId: parentId || null,
      createdBy: owner,
      image: imageUrl || null,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const qrUrl = `${frontendBaseUrl}/item/${item._id}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl);

    item.qrCode = qrDataUrl;
    await item.save();

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getItems = async (req: any, res: Response) => {
  try {
    const owner = req.user._id;
    const items = await Item.find({ owner });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getItemById = async (req: any, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateItem = async (req: any, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    Object.assign(item, req.body, { editedBy: req.user._id });
    await item.save();
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteItem = async (req: any, res: Response) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
