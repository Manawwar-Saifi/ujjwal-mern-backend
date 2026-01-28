import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

/**
 * UPLOAD MIDDLEWARE
 *
 * Handles file uploads using Multer and Cloudinary
 *
 * Usage:
 * - router.post('/reports', uploadSingle('file'), reportController.uploadReport)
 * - After this middleware, req.uploadedFile contains Cloudinary upload result
 */

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter - allowed file types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images, PDFs and Word documents are allowed."), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

/**
 * Upload single file to Cloudinary
 * @param {string} fieldName - Form field name for the file
 * @returns {Function} Express middleware
 */
export const uploadSingle = (fieldName = "file") => {
  return async (req, res, next) => {
    // First use multer to parse the file
    upload.single(fieldName)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        // Multer error
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB.",
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        // Other error (like file type)
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // If no file was uploaded, continue without uploading
      if (!req.file) {
        return next();
      }

      try {
        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file);

        // Attach result to request
        req.uploadedFile = {
          url: result.secure_url,
          publicId: result.public_id,
          fileName: req.file.originalname,
          fileSize: req.file.size,
          fileType: req.file.mimetype,
          thumbnailUrl: result.thumbnail_url,
          format: result.format,
          width: result.width,
          height: result.height,
        };

        next();
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload file to cloud storage.",
        });
      }
    });
  };
};

/**
 * Upload multiple files to Cloudinary
 * @param {string} fieldName - Form field name for the files
 * @param {number} maxCount - Maximum number of files
 * @returns {Function} Express middleware
 */
export const uploadMultiple = (fieldName = "files", maxCount = 5) => {
  return async (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB per file.",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum ${maxCount} files allowed.`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (!req.files || req.files.length === 0) {
        return next();
      }

      try {
        // Upload all files to Cloudinary
        const uploadPromises = req.files.map((file) => uploadToCloudinary(file));
        const results = await Promise.all(uploadPromises);

        // Attach results to request
        req.uploadedFiles = results.map((result, index) => ({
          url: result.secure_url,
          publicId: result.public_id,
          fileName: req.files[index].originalname,
          fileSize: req.files[index].size,
          fileType: req.files[index].mimetype,
          thumbnailUrl: result.thumbnail_url,
          format: result.format,
        }));

        next();
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload files to cloud storage.",
        });
      }
    });
  };
};

/**
 * Upload buffer to Cloudinary
 * @param {Object} file - Multer file object
 * @returns {Promise} Cloudinary upload result
 */
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    // Create upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ujjwal-dental", // Cloudinary folder
        resource_type: "auto", // Auto-detect file type
        use_filename: true,
        unique_filename: true,
        // Generate thumbnail for images and first page of PDFs
        transformation: [
          {
            width: 200,
            height: 200,
            crop: "thumb",
            gravity: "center",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Pipe the buffer to the upload stream
    const readableStream = Readable.from(file.buffer);
    readableStream.pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

/**
 * Get signed URL for private files
 * @param {string} publicId - Cloudinary public ID
 * @param {number} expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns {string} Signed URL
 */
export const getSignedUrl = (publicId, expiresIn = 3600) => {
  return cloudinary.url(publicId, {
    sign_url: true,
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  });
};

export default upload;
