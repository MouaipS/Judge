import multer from "multer";

// -----> Pour upload une image avatar -  
// -----> memoryStorage pour stocker image sur la RAM pour etre traite et pas save direct sur le disque 
// -----> limit de 5Mo et seulement jpeg png webp
export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("FORMAT_NON_SUPPORTE"));
    }
  },
});