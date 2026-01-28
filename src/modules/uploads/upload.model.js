import mongoose from "mongoose";

/**
 * UPLOAD MODEL
 * Stores file upload metadata from Cloudinary
 *
 * This model tracks all uploaded files (PDFs, images, documents)
 * and their Cloudinary storage details.
 *
 * USAGE EXAMPLE:
 * --------------
 * import Upload from './upload.model.js';
 *
 * // Create a new upload record
 * const upload = await Upload.create({
 *   url: 'https://res.cloudinary.com/xxx/file.pdf',
 *   publicId: 'ujjwal-dental/abc123',
 *   fileName: 'report.pdf',
 *   fileType: 'application/pdf',
 *   fileSize: 1024000,
 *   uploadedBy: userId,        // Optional: who uploaded
 *   relatedTo: {               // Optional: link to another document
 *     model: 'Patient',
 *     document: patientId
 *   }
 * });
 *
 * // Find uploads by user
 * const userUploads = await Upload.find({ uploadedBy: userId });
 *
 * // Find uploads related to a patient
 * const patientFiles = await Upload.find({
 *   'relatedTo.model': 'Patient',
 *   'relatedTo.document': patientId
 * });
 */

const uploadSchema = new mongoose.Schema(
  {
    // ============ CLOUDINARY DATA ============

    // Cloudinary secure URL (use this to access the file)
    url: {
      type: String,
      required: [true, "File URL is required"],
    },

    // Cloudinary public ID (use this to delete/update the file)
    publicId: {
      type: String,
      required: [true, "Public ID is required"],
      unique: true,
    },

    // Thumbnail URL (for images/PDFs)
    thumbnailUrl: {
      type: String,
    },

    // ============ FILE METADATA ============

    // Original file name
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },

    // MIME type (e.g., 'application/pdf', 'image/jpeg')
    fileType: {
      type: String,
      required: [true, "File type is required"],
    },

    // File size in bytes
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
    },

    // File format from Cloudinary (pdf, jpg, png, etc.)
    format: {
      type: String,
    },

    // Dimensions for images
    width: Number,
    height: Number,

    // ============ CATEGORIZATION ============

    // Category for organizing files
    category: {
      type: String,
      enum: ["document", "image", "report", "prescription", "xray", "other"],
      default: "document",
    },

    // Custom title/label for the file
    title: {
      type: String,
    },

    // Description or notes about the file
    description: {
      type: String,
    },

    // Tags for searching
    tags: [String],

    // ============ RELATIONSHIPS ============

    // Who uploaded this file (User/Admin)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Link to related document (Patient, Appointment, Treatment, etc.)
    relatedTo: {
      model: {
        type: String,
        enum: ["Patient", "Appointment", "Treatment", "Invoice", "None"],
        default: "None",
      },
      document: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedTo.model",
      },
    },

    // ============ STATUS ============

    // Is file active/visible?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ============ INDEXES ============

// Index for finding uploads by user
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });

// Index for finding uploads by related document
uploadSchema.index({ "relatedTo.model": 1, "relatedTo.document": 1 });

// Index for searching by category
uploadSchema.index({ category: 1 });

// Index for searching by tags
uploadSchema.index({ tags: 1 });

// ============ VIRTUALS ============

/**
 * Get human-readable file size
 */
uploadSchema.virtual("fileSizeFormatted").get(function () {
  const bytes = this.fileSize;
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
});

/**
 * Check if file is an image
 */
uploadSchema.virtual("isImage").get(function () {
  return this.fileType && this.fileType.startsWith("image/");
});

/**
 * Check if file is a PDF
 */
uploadSchema.virtual("isPdf").get(function () {
  return this.fileType === "application/pdf";
});

// Enable virtuals in JSON
uploadSchema.set("toJSON", { virtuals: true });
uploadSchema.set("toObject", { virtuals: true });

// ============ STATICS ============

/**
 * Find uploads by category
 */
uploadSchema.statics.findByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ createdAt: -1 });
};

/**
 * Find uploads for a specific patient
 */
uploadSchema.statics.findByPatient = function (patientId) {
  return this.find({
    "relatedTo.model": "Patient",
    "relatedTo.document": patientId,
    isActive: true,
  }).sort({ createdAt: -1 });
};

/**
 * Get storage stats
 */
uploadSchema.statics.getStorageStats = async function () {
  const stats = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  const total = await this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        totalSize: { $sum: "$fileSize" },
      },
    },
  ]);

  return {
    byCategory: stats,
    total: total[0] || { totalCount: 0, totalSize: 0 },
  };
};

// Create and export the model
const Upload = mongoose.model("Upload", uploadSchema);

export default Upload;
