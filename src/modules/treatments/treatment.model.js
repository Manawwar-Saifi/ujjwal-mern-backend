import mongoose from "mongoose";

/**
 * TREATMENT MODELS
 *
 * Two models in this file:
 * 1. TreatmentMaster - Catalog of all treatment types with pricing
 * 2. Treatment - Actual treatments given to patients
 *
 * Example treatments:
 * - Dental Cleaning: ₹500
 * - Root Canal: ₹5000-8000
 * - Tooth Extraction: ₹500-1500
 * - Dental Implant: ₹25000-45000
 */

// ============ TREATMENT MASTER SCHEMA ============
// This is the catalog/menu of treatments offered

const treatmentMasterSchema = new mongoose.Schema(
  {
    // Treatment name
    name: {
      type: String,
      required: [true, "Treatment name is required"],
      unique: true,
    },

    // Short code for quick reference
    code: {
      type: String,
      required: [true, "Treatment code is required"],
      unique: true,
      uppercase: true,
    },

    // Category for grouping
    category: {
      type: String,
      enum: [
        "preventive", // Cleaning, checkup
        "restorative", // Filling, crown
        "endodontic", // Root canal
        "periodontic", // Gum treatment
        "prosthodontic", // Dentures, implants
        "orthodontic", // Braces
        "surgical", // Extraction
        "cosmetic", // Whitening, veneers
        "pediatric", // Kids treatments
        "other",
      ],
      required: [true, "Category is required"],
    },

    // Description of the treatment
    description: String,

    // Price range
    price: {
      type: Number,
    },

    // Typical duration in minutes
    duration: {
      type: Number,
      default: 30, // 30 minutes
    },

    // Number of sessions typically required
    sessionsRequired: {
      type: Number,
      default: 1,
    },

    // Is this treatment active?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// ============ TREATMENT SESSION SCHEMA ============
// For multi-session treatments (like root canal)

const sessionSchema = new mongoose.Schema(
  {
    sessionNumber: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // What was done in this session
    notes: String,

    // Staff who performed
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Status of this session
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { _id: true, timestamps: true },
);

// ============ TREATMENT SCHEMA ============
// Actual treatment given to a patient

const treatmentSchema = new mongoose.Schema(
  {
    // Unique treatment number
    treatmentNumber: {
      type: String,
      unique: true,
    },

    // Patient receiving treatment
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },

    // Treatment type from master catalog
    treatmentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentMaster",
      required: [true, "Treatment type is required"],
    },

    // Clinic where treatment is done
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: [true, "Clinic is required"],
    },

    // Related appointment (optional)
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    // Teeth involved (dental notation)
    // Universal numbering: 1-32 for adults, A-T for children
    teeth: [
      {
        type: String,
      },
    ],

    // Treatment status
    status: {
      type: String,
      enum: ["planned", "in_progress", "completed", "cancelled"],
      default: "planned",
    },

    // Actual price charged (may differ from catalog)
    price: {
      type: Number,
      required: [true, "Treatment price is required"],
    },

    // Discount applied (from membership or special)
    discount: {
      percentage: {
        type: Number,
        default: 0,
      },
      amount: {
        type: Number,
        default: 0,
      },
      reason: String,
    },

    // Final amount after discount
    finalAmount: {
      type: Number,
    },

    // Sessions for multi-session treatments
    sessions: [sessionSchema],

    // Total sessions required
    totalSessions: {
      type: Number,
      default: 1,
    },

    // Completed sessions count
    completedSessions: {
      type: Number,
      default: 0,
    },

    // Treatment notes
    notes: String,

    // Diagnosis
    diagnosis: String,

    // Treatment plan details
    treatmentPlan: String,

    // Start date
    startDate: Date,

    // Completion date
    completionDate: Date,

    // Follow-up required?
    followUpRequired: {
      type: Boolean,
      default: false,
    },

    // Follow-up date
    followUpDate: Date,

    // Staff who initiated treatment
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Invoice reference (if billed)
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
  },
  {
    timestamps: true,
  },
);

// ============ INDEXES ============

treatmentSchema.index({ patient: 1, createdAt: -1 });
// treatmentSchema.index({ treatmentNumber: 1 });
treatmentSchema.index({ status: 1 });

// ============ PRE-SAVE MIDDLEWARE ============

/**
 * Generate treatment number and calculate final amount
 */
treatmentSchema.pre("save", async function () {
  // Generate treatment number for new documents
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const count = await mongoose.model("Treatment").countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      },
    });

    const serial = (count + 1).toString().padStart(4, "0");
    this.treatmentNumber = `TRT-${year}${month}-${serial}`;
  }

  // Calculate final amount
  if (this.price) {
    let amount = this.price;

    if (this.discount?.percentage) {
      amount -= (amount * this.discount.percentage) / 100;
    }

    if (this.discount?.amount) {
      amount -= this.discount.amount;
    }

    this.finalAmount = Math.max(0, Math.round(amount));
  }
});

// ============ METHODS ============

/**
 * Add a new session to the treatment
 */
treatmentSchema.methods.addSession = function (sessionData) {
  const sessionNumber = this.sessions.length + 1;
  this.sessions.push({
    sessionNumber,
    ...sessionData,
  });

  // Update status if first session
  if (this.status === "planned") {
    this.status = "in_progress";
    this.startDate = new Date();
  }

  return this.save();
};

/**
 * Complete a session
 */
treatmentSchema.methods.completeSession = function (sessionId, notes) {
  const session = this.sessions.id(sessionId);
  if (session) {
    session.status = "completed";
    session.notes = notes || session.notes;
    this.completedSessions += 1;

    // If all sessions completed, mark treatment as completed
    if (this.completedSessions >= this.totalSessions) {
      this.status = "completed";
      this.completionDate = new Date();
    }
  }
  return this.save();
};

/**
 * Mark treatment as completed
 */
treatmentSchema.methods.complete = function () {
  this.status = "completed";
  this.completionDate = new Date();
  this.completedSessions = this.totalSessions;
  return this.save();
};

/**
 * Cancel treatment
 */
treatmentSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  this.notes = this.notes
    ? `${this.notes}\nCancelled: ${reason}`
    : `Cancelled: ${reason}`;
  return this.save();
};

/**
 * Schedule follow-up
 */
treatmentSchema.methods.scheduleFollowUp = function (date) {
  this.followUpRequired = true;
  this.followUpDate = date;
  return this.save();
};

// Create and export the models
const TreatmentMaster = mongoose.model(
  "TreatmentMaster",
  treatmentMasterSchema,
);
const Treatment = mongoose.model("Treatment", treatmentSchema);

export { TreatmentMaster, Treatment };
export default Treatment;
