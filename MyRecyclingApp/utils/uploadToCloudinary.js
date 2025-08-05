// uploadToCloudinary.js
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '@env';

/**
 * Upload a local image URI to Cloudinary using an unsigned preset.
 * @param {string} localUri  The file:// URI from Expo ImagePicker
 * @returns {Promise<string>} HTTPS URL of the uploaded image
 */
async function uploadToCloudinary(localUri) {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // Optionally: formData.append('folder', 'profile_pictures');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    if (!data.secure_url) {
      console.error('Cloudinary error response:', data);
      throw new Error('Cloudinary upload failed');
    }
    return data.secure_url;
  } catch (err) {
    console.error('uploadToCloudinary error:', err);
    throw err;
  }
}

export default uploadToCloudinary;
