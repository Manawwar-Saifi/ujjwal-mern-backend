import mongoose from 'mongoose';

/**
 * TEST MODELS
 *
 * Two models in this file:
 * 1. TestMaster - Catalog of all test types with pricing
 * 2. Test - Actual tests ordered for patients
 *
 * Example tests:
 * - X-Ray: ₹200-500
 * - OPG (Panoramic): ₹500
 * - CBCT Scan: ₹2000-3500
 * - Blood Test: ₹500-1500
 */

// ============ TEST MASTER SCHEMA ============
// Catalog of available tests

const testMasterSchema = new mongoose.Schema(
  {
    // Test name
    name: {
      type: String,
      required: [true, 'Test name is required'],
      unique: true,
    },

    // Short code for quick reference
    code: {
      type: String,
      required: [true, 'Test code is required'],
      unique: true,
      uppercase: true,
    },

    // Category
    category: {
      type: String,
      enum: [
        'imaging', // X-ray, OPG, CBCT
        'lab', // Blood tests
        'diagnostic', // Other diagnostic tests
        'other',
      ],
      required: [true, 'Category is required'],
    },

    // Description
    description: String,

    // Price
    price: {
      type: Number,
      required: [true, 'Test price is required'],
    },

    // Is this test done in-house or referred out?
    isInHouse: {
      type: Boolean,
      default: true,
    },

    // Referred lab name (if not in-house)
    referredLab: String,

    // Typical turnaround time in hours
    turnaroundTime: {
      type: Number,
      default: 24, // 24 hours
    },

    // Is this test active?
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============ TEST SCHEMA ============
// Actual tests ordered for patients

const testSchema = new mongoose.Schema(
  {
    // Unique test number
    testNumber: {
      type: String,
      unique: true,
    },

    // Patient
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient is required'],
    },

    // Test type from master catalog
    testType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestMaster',
      required: [true, 'Test type is required'],
    },

    // Clinic where test was ordered
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clinic',
      required: [true, 'Clinic is required'],
    },

    // Related appointment (optional)
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },

    // Related treatment (optional)
    treatment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Treatment',
    },

    // Test status
    status: {
      type: String,
      enum: ['ordered', 'sample_collected', 'processing', 'completed', 'cancelled'],
      default: 'ordered',
    },

    // Ordered date
    orderedDate: {
      type: Date,
      default: Date.now,
    },

    // Sample collection date
    sampleCollectedDate: Date,

    // Result date
    resultDate: Date,

    // Price charged
    price: {
      type: Number,
      required: [true, 'Test price is required'],
    },

    // Discount
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

    // Final amount
    finalAmount: {
      type: Number,
    },

    // Test result summary (text)
    resultSummary: String,

    // Result values (for lab tests)
    resultValues: [
      {
        parameter: String,
        value: String,
        unit: String,
        normalRange: String,
        isAbnormal: Boolean,
      },
    ],

    // Report file (uploaded to Cloudinary)
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },

    // Notes
    notes: String,

    // Ordered by
    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Invoice reference
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
    },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============

testSchema.index({ patient: 1, createdAt: -1 });
// testSchema.index({ testNumber: 1 });
testSchema.index({ status: 1 });

// ============ PRE-SAVE MIDDLEWARE ============

/**
 * Generate test number and calculate final amount
 */
testSchema.pre('save', async function () {
  // Generate test number for new documents
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const count = await mongoose.model('Test').countDocuments({
      createdAt: {
        $gte: new Date(date.getFullYear(), date.getMonth(), 1),
        $lte: new Date(date.getFullYear(), date.getMonth() + 1, 0),
      },
    });

    const serial = (count + 1).toString().padStart(4, '0');
    this.testNumber = `TST-${year}${month}-${serial}`;
  }

  // Calculate final amount
  if (this.price) {
    const discountAmount = this.discount?.amount || 0;
    const discountPercentage = this.discount?.percentage || 0;

    let amount = this.price;

    if (discountPercentage > 0) {
      amount -= (amount * discountPercentage) / 100;
    }

    if (discountAmount > 0) {
      amount -= discountAmount;
    }

    this.finalAmount = Math.max(0, Math.round(amount));
  }
});


// ============ METHODS ============

/**
 * Mark sample as collected
 */
testSchema.methods.collectSample = function () {
  this.status = 'sample_collected';
  this.sampleCollectedDate = new Date();
  return this.save();
};

/**
 * Mark as processing
 */
testSchema.methods.startProcessing = function () {
  this.status = 'processing';
  return this.save();
};

/**
 * Complete test with results
 */
testSchema.methods.complete = function (resultData) {
  this.status = 'completed';
  this.resultDate = new Date();

  if (resultData.summary) {
    this.resultSummary = resultData.summary;
  }

  if (resultData.values) {
    this.resultValues = resultData.values;
  }

  if (resultData.reportId) {
    this.report = resultData.reportId;
  }

  return this.save();
};

/**
 * Cancel test
 */
testSchema.methods.cancel = function (reason) {
  this.status = 'cancelled';
  this.notes = this.notes ? `${this.notes}\nCancelled: ${reason}` : `Cancelled: ${reason}`;
  return this.save();
};

// Create and export the models
const TestMaster = mongoose.model('TestMaster', testMasterSchema);
const Test = mongoose.model('Test', testSchema);

export { TestMaster, Test };
export default Test;
