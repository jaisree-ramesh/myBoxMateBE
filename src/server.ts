import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import itemRoutes from "./routes/itemRoutes";
import collaboratorRoutes from "./routes/collaboratorRoutes";
import "./config/passport";
import googleAuthRoutes from "./routes/googleAuthRoutes";
import spaceRoutes from "./routes/spaceRoutes";

connectDB();

const PORT = process.env.PORT || 4000;
const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes

app.use("/api/auth", googleAuthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/collaboration", collaboratorRoutes);
app.use("/api", spaceRoutes);

// Simple route
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "BoxMate backend",
    env: process.env.NODE_ENV || "dev",
  });
});

// Start
app.listen(PORT, () => {
  console.log(`BoxMate server running on http://localhost:${PORT}`);
});
