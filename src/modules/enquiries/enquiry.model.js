import mongoose from "mongoose";

/**
 * ENQUIRY MODEL
 *
 * Handles enquiries/leads from treatment pages and other sources.
 * Tracks contact info, treatment interest, and follow-up status.
 *
 * USAGE:
 * ------
 * // Create new enquiry (from form submission)
 * const enquiry = await Enquiry.create({
 *   name: "John Doe",
 *   phone: "9876543210",
 *   treatment: treatmentPageId,
 *   treatmentName: "Root Canal Treatment",
 *   source: { page: "root-canal-treatment-rct", utm_source: "google" }
 * });
 *
 * // Find enquiries by treatment
 * const leads = await Enquiry.find({ treatment: treatmentId });
 *
 * // Update status
 * await enquiry.updateStatus('contacted', userId);
 */

// ============ NOTE SCHEMA (for follow-up notes) ============
const noteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// ============ SOURCE SCHEMA (UTM tracking) ============
const sourceSchema = new mongoose.Schema(
  {
    page: String, // Page URL/slug where form was submitted
    referrer: String, // Referring URL
    utm_source: String, // google, facebook, etc.
    utm_medium: String, // cpc, organic, etc.
    utm_campaign: String, // Campaign name
    utm_term: String, // Search term
    utm_content: String, // Ad content
    device: {
      type: String,
      enum: ["desktop", "mobile", "tablet", "unknown"],
      default: "unknown",
    },
    browser: String,
    ip: String,
  },
  { _id: false }
);

// ============ MAIN ENQUIRY SCHEMA ============
const enquirySchema = new mongoose.Schema(
  {
    // Auto-generated enquiry number: ENQ-YYMMDD-0001
    enquiryNumber: {
      type: String,
      unique: true,
    },

    // ========== CONTACT INFO ==========
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // ========== TREATMENT REFERENCE ==========
    treatment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentPage",
    },

    treatmentName: {
      type: String, // Stored for quick reference without populate
    },

    // ========== ENQUIRY DETAILS ==========
    message: {
      type: String,
      trim: true,
    },

    preferredDate: Date,

    preferredTime: {
      type: String, // "Morning", "Afternoon", "Evening" or specific time
    },

    preferredClinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
    },

    // ========== SOURCE TRACKING ==========
    source: sourceSchema,

    // ========== STATUS MANAGEMENT ==========
    status: {
      type: String,
      enum: [
        "new", // Just received
        "contacted", // Attempted to contact
        "appointment_scheduled", // Appointment booked
        "visited", // Patient visited clinic
        "converted", // Became a patient
        "not_interested", // Not interested
        "invalid", // Wrong number, spam, etc.
        "closed", // Case closed
      ],
      default: "new",
    },

    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note: String,
      },
    ],

    // ========== FOLLOW-UP ==========
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: [noteSchema],

    nextFollowUp: Date,

    followUpCount: {
      type: Number,
      default: 0,
    },

    lastContactedAt: Date,

    // ========== CONVERSION ==========
    convertedToPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },

    convertedAt: Date,

    appointmentBooked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    // ========== FLAGS ==========
    isUrgent: {
      type: Boolean,
      default: false,
    },

    isSpam: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============

// For listing and filtering
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ treatment: 1, createdAt: -1 });
enquirySchema.index({ assignedTo: 1, status: 1 });
enquirySchema.index({ phone: 1 });
enquirySchema.index({ nextFollowUp: 1 });

// ============ PRE-SAVE MIDDLEWARE ============

/**
 * Generate enquiry number before saving
 * Format: ENQ-YYMMDD-XXXX
 */
enquirySchema.pre("save", async function () {
  if (!this.isNew) return;

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Count today's enquiries
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const count = await mongoose.model("Enquiry").countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  });

  const serial = String(count + 1).padStart(4, "0");
  this.enquiryNumber = `ENQ-${year}${month}${day}-${serial}`;

  // Add initial status to history
  this.statusHistory.push({
    status: this.status,
    changedAt: new Date(),
    note: "Enquiry created",
  });
});

// ============ INSTANCE METHODS ============

/**
 * Update enquiry status with history tracking
 */
enquirySchema.methods.updateStatus = async function (newStatus, userId, note) {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    changedAt: new Date(),
    changedBy: userId,
    note: note || `Status changed to ${newStatus}`,
  });

  if (newStatus === "contacted") {
    this.lastContactedAt = new Date();
    this.followUpCount += 1;
  }

  return this.save();
};

/**
 * Add a note to the enquiry
 */
enquirySchema.methods.addNote = async function (text, userId) {
  this.notes.push({
    text,
    addedBy: userId,
    addedAt: new Date(),
  });
  return this.save();
};

/**
 * Assign enquiry to a staff member
 */
enquirySchema.methods.assignTo = async function (userId) {
  this.assignedTo = userId;
  return this.save();
};

/**
 * Schedule follow-up
 */
enquirySchema.methods.scheduleFollowUp = async function (date) {
  this.nextFollowUp = date;
  return this.save();
};

/**
 * Mark as converted (became a patient)
 */
enquirySchema.methods.markConverted = async function (patientId, userId) {
  this.status = "converted";
  this.convertedToPatient = patientId;
  this.convertedAt = new Date();
  this.statusHistory.push({
    status: "converted",
    changedAt: new Date(),
    changedBy: userId,
    note: "Converted to patient",
  });
  return this.save();
};

// ============ STATIC METHODS ============

/**
 * Get enquiry statistics
 */
enquirySchema.statics.getStats = async function (dateFrom, dateTo) {
  const matchQuery = {};

  if (dateFrom || dateTo) {
    matchQuery.createdAt = {};
    if (dateFrom) matchQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) matchQuery.createdAt.$lte = new Date(dateTo);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const byTreatment = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$treatmentName",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const bySource = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$source.utm_source",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const total = await this.countDocuments(matchQuery);

  return {
    total,
    byStatus: stats.reduce((acc, item) => {
      acc[item._id || "unknown"] = item.count;
      return acc;
    }, {}),
    byTreatment,
    bySource,
  };
};

/**
 * Get today's enquiries
 */
enquirySchema.statics.getTodayEnquiries = async function () {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  return this.find({
    createdAt: { $gte: startOfDay, $lte: endOfDay },
  }).sort({ createdAt: -1 });
};

/**
 * Get pending follow-ups
 */
enquirySchema.statics.getPendingFollowUps = async function (userId) {
  const query = {
    nextFollowUp: { $lte: new Date() },
    status: { $nin: ["converted", "not_interested", "invalid", "closed"] },
  };

  if (userId) {
    query.assignedTo = userId;
  }

  return this.find(query).sort({ nextFollowUp: 1 });
};

// ============ VIRTUALS ============

/**
 * Check if enquiry is new (created within last 24 hours)
 */
enquirySchema.virtual("isNew24h").get(function () {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.createdAt > oneDayAgo;
});

/**
 * Get days since enquiry was created
 */
enquirySchema.virtual("daysSinceCreated").get(function () {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Enable virtuals in JSON
enquirySchema.set("toJSON", { virtuals: true });
enquirySchema.set("toObject", { virtuals: true });

// Create and export the model
const Enquiry = mongoose.model("Enquiry", enquirySchema);

export default Enquiry;
