import mongoose, { Schema, Document, Types } from "mongoose";

export interface IItem extends Document {
  name: string;
  desc?: string;
  owner: Types.ObjectId;
  collaborators: Types.ObjectId[];
  createdBy: Types.ObjectId;
  editedBy?: Types.ObjectId;
  image?: string;
  qrCode?: string;
  box?: Types.ObjectId; // ← which Box this item belongs to
  parentId?: Types.ObjectId; // ← which Space this item belongs to
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: "User" },
    image: { type: String },
    qrCode: { type: String },
    box: { type: Schema.Types.ObjectId, ref: "Box" },
    parentId: { type: Schema.Types.ObjectId, ref: "Space" },
  },
  { timestamps: true },
);

export const Item = mongoose.model<IItem>("Item", itemSchema);
