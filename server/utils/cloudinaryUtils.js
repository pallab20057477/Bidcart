const cloudinary = require('../config/cloudinary');

const uploadToCloudinary = (file, folder = 'products') => {
  return cloudinary.uploader.upload(file.path, { folder });
};

const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { uploadToCloudinary, deleteFromCloudinary }; 