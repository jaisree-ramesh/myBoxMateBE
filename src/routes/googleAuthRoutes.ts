import express from "express";
import { OAuth2Client } from "google-auth-library";
import { generateToken } from "../utils/generateToken";
import { User } from "../models/user";

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID!);

router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      user = await User.create({
        username: payload.name || payload.email.split("@")[0],
        email: payload.email,
        password: null,
        googleId: payload.sub,
      });
    }

    const jwt = generateToken((user as any)._id.toString());

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      token: jwt,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google login failed" });
  }
});

export default router;
