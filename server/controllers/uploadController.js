// Example structure for upload controller
const ErrorHandler = require('../middleware/errorHandler');
// ... import any other needed modules ...

// Example controller function
const uploadFile = async (req, res) => {
  // ...move logic from upload.js here...
};

const uploadImage = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({
      url: req.file.path,
      public_id: req.file.filename,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};

// Add all other upload-related controller functions here, e.g.:
// const uploadProductImage = async (req, res) => { ... }
// ...

module.exports = {
  uploadFile,
  uploadImage,
  // uploadProductImage,
  // ... add all other functions here ...
}; 