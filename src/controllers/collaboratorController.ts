import { Response } from "express";
import { CollaboratorRequest } from "../models/collaboratorRequest";
import { Item } from "../models/item";
import { User } from "../models/user";

// Send collaboration request
export const sendRequest = async (req: any, res: Response) => {
  try {
    const { collaboratorEmail, itemId } = req.body;
    const senderId = req.user._id;

    // Find the user by email
    const receiver = await User.findOne({ email: collaboratorEmail });
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // Make sure the item exists
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Prevent sending duplicate pending requests
    const existing = await CollaboratorRequest.findOne({
      sender: senderId,
      receiver: receiver._id,
      item: itemId,
      status: "pending",
    });

    if (existing) {
      return res.status(400).json({ message: "Request already sent" });
    }

    // Create the request
    const request = await CollaboratorRequest.create({
      sender: senderId,
      receiver: receiver._id,
      item: itemId,
      status: "pending",
    });

    res.status(201).json({
      message: `Collaboration invite sent to ${receiver.username}`,
      request,
    });
  } catch (err) {
    console.error("Send request error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Accept or decline collaboration request
export const respondToRequest = async (req: any, res: Response) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" or "decline"
    const userId = req.user._id;

    const request = await CollaboratorRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.receiver.toString() !== userId.toString())
      return res.status(403).json({ message: "Not authorized" });

    if (action === "accept") {
      request.status = "accepted";
      await request.save();

      await Item.findByIdAndUpdate(request.item, {
        $addToSet: { collaborators: request.receiver },
      });
    } else {
      request.status = "declined";
      await request.save();
    }

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all collaboration requests for a user
export const getRequests = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const requests = await CollaboratorRequest.find({
      receiver: userId,
      status: "pending",
    }).populate("sender", "name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
