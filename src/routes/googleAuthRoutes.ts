import express from "express";
import passport from "passport";
import { generateToken } from "../utils/generateToken";

const router = express.Router();

// Redirect to Google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback from Google
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    // Generate JWT
    const token = generateToken((req.user as any)._id.toString());
    res.redirect(`${process.env.FRONTEND_URL}/?token=${token}`);
  }
);

export default router;
