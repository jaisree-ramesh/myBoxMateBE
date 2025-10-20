import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const testConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB connection successful!");

    // Test: list all collections
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db
        .listCollections()
        .toArray();
      console.log(
        "Collections in DB:",
        collections.map((c) => c.name)
      );
    } else {
      console.error("Database connection is not available.");
    }

    process.exit(0);
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

testConnection();
