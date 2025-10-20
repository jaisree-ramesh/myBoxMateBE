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
  parentId?: Types.ObjectId; // undefined = top-level box

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
    parentId: { type: Schema.Types.ObjectId, ref: "Item" },
  },
  { timestamps: true }
);

export const Item = mongoose.model<IItem>("Item", itemSchema);
