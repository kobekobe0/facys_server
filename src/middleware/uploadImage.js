import express from 'express';
import multer from 'multer';
import sharp from 'sharp';

const upload = multer({ storage: multer.memoryStorage() });

// Expect only one image
const uploadSingleImage = upload.single('image');

const processImage = async (req, res, next) => {
  console.log(req.body)
  if(req.body.updatePfp !== undefined && req.body.updatePfp == 'false') {
    console.log('hit')
    return next()
  }
  try {
    console.log(req.files ? req.files : 'No files')
    console.log(req.file ? req.file : 'No file')
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Compress the image and convert it to WebP format
    const compressedBuffer = await sharp(req.file.buffer)
      .resize({ width: 600, height: 600 }) // Resize if needed, adjust as required
      .jpeg({ quality: 60 }) // Set quality for compression
      .toBuffer();

    // Convert the compressed buffer to Base64
    const base64Image = compressedBuffer.toString('base64');
    const mimeType = 'image/webp'; // Since we are converting to WebP

    // Create a full Base64 string
    const base64String = `data:${mimeType};base64,${base64Image}`;

    // Attach the Base64 string to req.filename
    req.filename = base64String;
    console.log(base64String)
    //req.status(200).json({ message: 'Image uploaded successfully' });
    // Call the next middleware
    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export { uploadSingleImage, processImage };
