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

const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header include health checks and server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  }),
);
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
const startServer = async () => {
  try {
    await connectDB();
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`BoxMate server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start BoxMate server:", error);
    process.exit(1);
  }
};

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "BoxMate backend",
    env: process.env.NODE_ENV || "dev",
  });
});

void startServer();
