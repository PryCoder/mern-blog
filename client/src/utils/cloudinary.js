// Cloudinary Upload Utility
// Cloud name extracted from CLOUDINARY_URL: cloudinary://<api_key>:<api_secret>@do4h3t3mk
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'do4h3t3mk';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Callback for progress (0-100)
 * @returns {Promise<string>} - Download URL of uploaded image
 */
export const uploadToCloudinary = async (file, onProgress = null) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const resourceType = file.type?.startsWith('video/') ? 'video' : 'image';

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    // Don't send cloud_name - it's in the URL instead

    // Upload to Cloudinary
    const xhr = new XMLHttpRequest();

    // Track progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(Math.round(progress));
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } else {
          // Log more detailed error info from Cloudinary
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            console.error('Cloudinary API Error:', errorResponse.error?.message || errorResponse);
            reject(new Error(`Upload failed: ${errorResponse.error?.message || 'Unknown error'}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload error'));
      });

      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary (requires server-side delete token)
 * @param {string} publicId - Public ID of image to delete
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    // This requires a backend endpoint that uses your Cloudinary API key
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    return response.ok;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};
