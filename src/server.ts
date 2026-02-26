import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import itemRoutes from "./routes/itemRoutes";
import spaceRoutes from "./routes/spaceRoutes";
import boxRoutes from "./routes/boxRoutes";
import collaboratorRoutes from "./routes/collaboratorRoutes";
import "./config/passport";
import googleAuthRoutes from "./routes/googleAuthRoutes";

connectDB();

const PORT = process.env.PORT || 4000;
const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" })); // increased for base64 images
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth
app.use("/api/auth", googleAuthRoutes);
app.use("/api/auth", authRoutes);

// Resources
app.use("/api/items", itemRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/boxes", boxRoutes);
app.use("/api/collaboration", collaboratorRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "BoxMate backend",
    env: process.env.NODE_ENV || "dev",
  });
});

app.listen(PORT, () => {
  console.log(`BoxMate server running on http://localhost:${PORT}`);
});
