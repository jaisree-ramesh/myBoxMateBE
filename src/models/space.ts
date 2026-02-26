import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISpace extends Document {
  name: string;
  alt: string;
  image?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const spaceSchema = new Schema<ISpace>(
  {
    name: { type: String, required: true, trim: true },
    alt: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Space = mongoose.model<ISpace>("Space", spaceSchema);
