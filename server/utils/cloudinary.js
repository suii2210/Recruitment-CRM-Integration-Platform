import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to delete image
const deleteImage = async (publicId) => {
  try {
    if (publicId) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Image deleted:', result);
      return result;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Helper function to upload image
const uploadImage = async (filePath, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'home-content',
      transformation: [
        { width: 1200, height: 800, crop: 'fill', quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    };
    
    const result = await cloudinary.uploader.upload(filePath, {
      ...defaultOptions,
      ...options
    });
    
    return result;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Helper function to get optimized image URL
const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    width: 800,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  };
  
  return cloudinary.url(publicId, {
    ...defaultOptions,
    ...options
  });
};

export default cloudinary;
export { deleteImage, uploadImage, getOptimizedImageUrl };