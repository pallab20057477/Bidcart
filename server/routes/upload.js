const express = require('express');
const multer = require('multer');
const { auth } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'products',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(buffer);
  });
};

// Upload multiple images route
const uploadImages = async (req, res) => {
  try {
    console.log('📤 Received image upload request');
    console.log('Files received:', req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    const imageUrls = [];
    const failedUploads = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        console.log(`📤 Uploading image ${i + 1}/${req.files.length} to Cloudinary...`);
        
        const result = await uploadToCloudinary(file.buffer);
        imageUrls.push(result.secure_url);
        console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
        
      } catch (uploadError) {
        console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
        failedUploads.push({
          index: i + 1,
          error: uploadError.message
        });
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ 
        message: 'All image uploads failed',
        failures: failedUploads
      });
    }

    console.log(`✅ Successfully uploaded ${imageUrls.length} images`);
    res.json({
      success: true,
      imageUrls,
      message: `${imageUrls.length} images uploaded successfully`,
      failures: failedUploads.length > 0 ? failedUploads : undefined
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    res.status(500).json({ 
      message: 'Image upload failed',
      error: error.message 
    });
  }
};

// Single image upload route
const uploadSingleImage = async (req, res) => {
  try {
    console.log('📤 Received single image upload request');
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    console.log('📤 Uploading single image to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer);
    
    console.log('✅ Single image uploaded to Cloudinary:', result.secure_url);
    res.json({
      success: true,
      url: result.secure_url,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Single image upload error:', error);
    res.status(500).json({ 
      message: 'Image upload failed',
      error: error.message 
    });
  }
};

// Test route to check if upload routes are loaded
router.get('/test', (req, res) => {
  console.log('✅ Upload routes are loaded and accessible');
  res.json({ 
    message: 'Upload routes are working',
    timestamp: new Date().toISOString(),
    availableRoutes: ['/upload/images', '/upload/image']
  });
});

// Define the routes with proper middleware chain
router.post('/images', auth, upload.array('images', 5), uploadImages);
router.post('/image', auth, upload.single('image'), uploadSingleImage);

module.exports = router;