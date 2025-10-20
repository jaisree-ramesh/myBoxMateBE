import mongoose, { Schema, Document } from "mongoose";

export interface ICollaboratorRequest extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  item: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "declined";
}

const collaboratorRequestSchema = new Schema<ICollaboratorRequest>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const CollaboratorRequest = mongoose.model<ICollaboratorRequest>(
  "CollaboratorRequest",
  collaboratorRequestSchema
);
