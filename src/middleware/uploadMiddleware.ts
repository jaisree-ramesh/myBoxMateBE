import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const itemStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    public_id: `boxmate-items/${file.originalname}`,
    allowed_formats: ["jpg", "jpeg", "png"],
  }),
});

const spaceStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: "boxmate-spaces",
    public_id: `${Date.now()}-${file.originalname.replace(/\.[^.]+$/, "")}`,
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
  }),
});

export const upload = multer({ storage: itemStorage });
export const spaceUpload = multer({
  storage: spaceStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) callback(null, true);
    else callback(new Error("Only image files are allowed"));
  },
});
