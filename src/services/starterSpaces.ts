import { Types } from "mongoose";
import { Item } from "../models/item";
import { type IUser, User } from "../models/user";
import { CollaboratorRequest } from "../models/collaboratorRequest";

export const starterSpaces = [
  { id: "Closet", name: "Closet" },
  { id: "Fridge", name: "Fridge" },
  { id: "Garage", name: "Garage" },
  { id: "Garden", name: "Garden" },
  { id: "Kitchen", name: "Kitchen" },
  { id: "Basement", name: "Basement" },
] as const;

export const ensureStarterSpaces = async (user: Pick<IUser, "_id" | "spacesSeededAt">) => {
  if (user.spacesSeededAt) return;

  const ownerId = user._id as Types.ObjectId;
  await Item.bulkWrite(
    starterSpaces.map((space) => ({
      updateOne: {
        filter: {
          owner: ownerId,
          kind: "space",
          $or: [{ seedKey: space.id }, { name: space.name, seedKey: { $exists: false } }],
        },
        update: {
          $setOnInsert: {
            name: space.name,
            kind: "space",
            owner: ownerId,
            createdBy: ownerId,
            image: `builtin:${space.id}`,
            seedKey: space.id,
            collaborators: [],
          },
        },
        upsert: true,
      },
    })),
    { ordered: true },
  );

  await User.updateOne({ _id: ownerId }, { $set: { spacesSeededAt: new Date() } });
};

export const acceptedCollaboratorIds = async (ownerId: Types.ObjectId) =>
  CollaboratorRequest.distinct("receiver", {
    sender: ownerId,
    status: "accepted",
    scope: "all",
  });
