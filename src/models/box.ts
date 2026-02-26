import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBox extends Document {
  name: string;
  desc?: string;
  icon?: string;
  color?: string;
  parentId: Types.ObjectId; // Space this box belongs to
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const boxSchema = new Schema<IBox>(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String },
    icon: { type: String, default: "📦" },
    color: { type: String, default: "#D97706" },
    parentId: { type: Schema.Types.ObjectId, ref: "Space", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Box = mongoose.model<IBox>("Box", boxSchema);
