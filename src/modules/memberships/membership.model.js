import mongoose from 'mongoose';

/**
 * MEMBERSHIP PLAN MODEL
 *
 * Membership plans for Ujjwal Dental Clinic
 *
 * Plans offered:
 * 1. Individual Silver - ₹999/year - 10% discount
 * 2. Individual Gold - ₹1999/year - 15% discount + 1 free cleaning
 * 3. Individual Platinum - ₹2999/year - 20% discount + 2 free cleanings
 * 4. Family Silver - ₹1999/year - 10% discount (up to 4 members)
 * 5. Family Gold - ₹3499/year - 15% discount + 2 free cleanings
 * 6. Family Platinum - ₹4999/year - 20% discount + 4 free cleanings
 *
 * Note: Patient's membership details are embedded in Patient model
 * This model is just for membership plan definitions
 */

// ============ BENEFIT SCHEMA ============

const benefitSchema = new mongoose.Schema(
  {
    // Benefit type
    type: {
      type: String,
      enum: ['discount', 'free_service', 'priority_booking', 'home_visit', 'other'],
      required: true,
    },

    // Description
    description: {
      type: String,
      required: true,
    },

    // For discount type: percentage
    discountPercentage: Number,

    // For free_service type: service name and quantity
    freeService: {
      name: String,
      quantity: Number,
    },

    // Any conditions
    conditions: String,
  },
  { _id: false }
);

// ============ MEMBERSHIP PLAN SCHEMA ============

const membershipPlanSchema = new mongoose.Schema(
  {
    // Plan name
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      unique: true,
    },

    // Plan code for reference
    code: {
      type: String,
      required: [true, 'Plan code is required'],
      unique: true,
      uppercase: true,
    },

    // Plan type
    type: {
      type: String,
      enum: ['individual', 'family'],
      required: [true, 'Plan type is required'],
    },

    // Tier level
    tier: {
      type: String,
      enum: ['silver', 'gold', 'platinum'],
      required: [true, 'Plan tier is required'],
    },

    // Description
    description: String,

    // Price per year
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
    },

    // Duration in months
    durationMonths: {
      type: Number,
      default: 12, // 1 year
    },

    // Discount percentage on treatments
    discountPercentage: {
      type: Number,
      required: [true, 'Discount percentage is required'],
      min: 0,
      max: 100,
    },

    // For family plans: max members allowed
    maxMembers: {
      type: Number,
      default: 1, // 1 for individual, 4 for family
    },

    // Benefits list
    benefits: [benefitSchema],

    // Features list (simple text)
    features: [String],

    // Is this plan currently available?
    isActive: {
      type: Boolean,
      default: true,
    },

    // Display order for UI
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ============ INDEXES ============

membershipPlanSchema.index({ type: 1, tier: 1 });
membershipPlanSchema.index({ isActive: 1 });

// ============ VIRTUALS ============

/**
 * Get formatted price display
 */
membershipPlanSchema.virtual('priceDisplay').get(function () {
  return `₹${this.price.toLocaleString('en-IN')}/year`;
});

/**
 * Get full plan name
 */
membershipPlanSchema.virtual('fullName').get(function () {
  const typeCapitalized = this.type.charAt(0).toUpperCase() + this.type.slice(1);
  const tierCapitalized = this.tier.charAt(0).toUpperCase() + this.tier.slice(1);
  return `${typeCapitalized} ${tierCapitalized}`;
});

// Enable virtuals in JSON
membershipPlanSchema.set('toJSON', { virtuals: true });
membershipPlanSchema.set('toObject', { virtuals: true });

// ============ STATICS ============

/**
 * Get all active plans grouped by type
 */
membershipPlanSchema.statics.getActivePlans = async function () {
  const plans = await this.find({ isActive: true }).sort({ displayOrder: 1 });

  return {
    individual: plans.filter((p) => p.type === 'individual'),
    family: plans.filter((p) => p.type === 'family'),
  };
};

/**
 * Seed default membership plans
 * Call this once during initial setup
 */
membershipPlanSchema.statics.seedDefaultPlans = async function () {
  const defaultPlans = [
    // Individual Plans
    {
      name: 'Individual Silver',
      code: 'IND-SLV',
      type: 'individual',
      tier: 'silver',
      description: 'Basic membership for individuals with 10% discount on all treatments',
      price: 999,
      discountPercentage: 10,
      maxMembers: 1,
      features: [
        '10% discount on all treatments',
        'Priority appointment booking',
        'Free dental checkup on enrollment',
      ],
      benefits: [
        { type: 'discount', description: '10% off on all treatments', discountPercentage: 10 },
        { type: 'priority_booking', description: 'Priority appointment booking' },
      ],
      displayOrder: 1,
    },
    {
      name: 'Individual Gold',
      code: 'IND-GLD',
      type: 'individual',
      tier: 'gold',
      description: 'Premium membership with 15% discount and 1 free cleaning',
      price: 1999,
      discountPercentage: 15,
      maxMembers: 1,
      features: [
        '15% discount on all treatments',
        '1 free dental cleaning per year',
        'Priority appointment booking',
        'Free dental checkup on enrollment',
      ],
      benefits: [
        { type: 'discount', description: '15% off on all treatments', discountPercentage: 15 },
        { type: 'free_service', description: '1 free dental cleaning per year', freeService: { name: 'Dental Cleaning', quantity: 1 } },
        { type: 'priority_booking', description: 'Priority appointment booking' },
      ],
      displayOrder: 2,
    },
    {
      name: 'Individual Platinum',
      code: 'IND-PLT',
      type: 'individual',
      tier: 'platinum',
      description: 'Elite membership with 20% discount and 2 free cleanings',
      price: 2999,
      discountPercentage: 20,
      maxMembers: 1,
      features: [
        '20% discount on all treatments',
        '2 free dental cleanings per year',
        'Priority appointment booking',
        'Free dental checkup on enrollment',
        'Free X-ray on enrollment',
      ],
      benefits: [
        { type: 'discount', description: '20% off on all treatments', discountPercentage: 20 },
        { type: 'free_service', description: '2 free dental cleanings per year', freeService: { name: 'Dental Cleaning', quantity: 2 } },
        { type: 'priority_booking', description: 'Priority appointment booking' },
      ],
      displayOrder: 3,
    },

    // Family Plans
    {
      name: 'Family Silver',
      code: 'FAM-SLV',
      type: 'family',
      tier: 'silver',
      description: 'Basic family membership for up to 4 members with 10% discount',
      price: 1999,
      discountPercentage: 10,
      maxMembers: 4,
      features: [
        '10% discount on all treatments',
        'Coverage for up to 4 family members',
        'Priority appointment booking',
        'Free dental checkup for all members',
      ],
      benefits: [
        { type: 'discount', description: '10% off on all treatments', discountPercentage: 10 },
        { type: 'priority_booking', description: 'Priority appointment booking' },
      ],
      displayOrder: 4,
    },
    {
      name: 'Family Gold',
      code: 'FAM-GLD',
      type: 'family',
      tier: 'gold',
      description: 'Premium family membership with 15% discount and 2 free cleanings',
      price: 3499,
      discountPercentage: 15,
      maxMembers: 4,
      features: [
        '15% discount on all treatments',
        'Coverage for up to 4 family members',
        '2 free dental cleanings per year (shared)',
        'Priority appointment booking',
        'Free dental checkup for all members',
      ],
      benefits: [
        { type: 'discount', description: '15% off on all treatments', discountPercentage: 15 },
        { type: 'free_service', description: '2 free dental cleanings per year', freeService: { name: 'Dental Cleaning', quantity: 2 } },
        { type: 'priority_booking', description: 'Priority appointment booking' },
      ],
      displayOrder: 5,
    },
    {
      name: 'Family Platinum',
      code: 'FAM-PLT',
      type: 'family',
      tier: 'platinum',
      description: 'Elite family membership with 20% discount and 4 free cleanings',
      price: 4999,
      discountPercentage: 20,
      maxMembers: 4,
      features: [
        '20% discount on all treatments',
        'Coverage for up to 4 family members',
        '4 free dental cleanings per year (shared)',
        'Priority appointment booking',
        'Free dental checkup for all members',
        'Free X-ray for all members',
        'Home visit available',
      ],
      benefits: [
        { type: 'discount', description: '20% off on all treatments', discountPercentage: 20 },
        { type: 'free_service', description: '4 free dental cleanings per year', freeService: { name: 'Dental Cleaning', quantity: 4 } },
        { type: 'priority_booking', description: 'Priority appointment booking' },
        { type: 'home_visit', description: 'Home visit available on request' },
      ],
      displayOrder: 6,
    },
  ];

  // Use upsert to avoid duplicates
  for (const plan of defaultPlans) {
    await this.findOneAndUpdate({ code: plan.code }, plan, { upsert: true, new: true });
  }

  console.log('Default membership plans seeded successfully');
};

// Create and export the model
const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;
