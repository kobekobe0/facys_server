import express from 'express';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs';

const upload = multer({ storage: multer.memoryStorage() });

// Expect only one image
const uploadSingleImage = upload.single('image');

const processImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const dir = './src/images/'
    const filename = req.params.id ? req.params.id + '_pfp.png' : new Date().getTime() + '_pfp.png';
    const outputPath = path.join(dir, filename);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const targetWidth = 150;
    const targetHeight = 150;

    const { width, height } = await sharp(file.buffer).metadata();
    const cropWidth = Math.min(width, targetWidth);
    const cropHeight = Math.min(height, targetHeight);
    const cropX = Math.floor((width - cropWidth) / 2);
    const cropY = Math.floor((height - cropHeight) / 2);

    await sharp(file.buffer)
      .extract({ width: cropWidth, height: cropHeight, left: cropX, top: cropY })
      .resize({ width: targetWidth, height: targetHeight })
      .png()
      .toFile(outputPath);

    req.filename = filename;
    
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export { uploadSingleImage, processImage };
