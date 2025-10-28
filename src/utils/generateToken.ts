import jwt, { SignOptions, Secret } from "jsonwebtoken";

export const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret)
    throw new Error("JWT_SECRET not defined in environment variables");

  const options: SignOptions = {
    expiresIn: "90d",
  };

  return jwt.sign({ id }, secret as Secret, options);
};
