import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import MembershipPlan from "./membership.model.js";
import Patient from "../patients/patient.model.js";
import mongoose from "mongoose";

/**
 * MEMBERSHIP CONTROLLER
 *
 * Handles:
 * - Membership Plans (catalog of available plans)
 * - Patient Memberships (assign, renew, cancel)
 */

// ==================== MEMBERSHIP PLANS (Catalog) ====================

/**
 * @desc    Get all membership plans
 * @route   GET /api/memberships/plans
 * @access  Public
 */
export const getAllPlans = asyncHandler(async (req, res) => {
  const { active = "true", type, tier } = req.query;

  // Build filter
  const filter = {};
  if (active === "true") {
    filter.isActive = true;
  }
  if (type) {
    filter.type = type;
  }
  if (tier) {
    filter.tier = tier;
  }

  // Query database
  const plans = await MembershipPlan.find(filter).sort({ displayOrder: 1 });

  // Group by type if requested
  if (req.query.grouped === "true") {
    const grouped = await MembershipPlan.getActivePlans();
    return ApiResponse.success(res, { plans: grouped }, "Membership plans fetched successfully");
  }

  ApiResponse.success(res, { plans }, "Membership plans fetched successfully");
});

/**
 * @desc    Get plan by ID
 * @route   GET /api/memberships/plans/:id
 * @access  Public
 */
export const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid plan ID", 400);
  }

  const plan = await MembershipPlan.findById(id);

  if (!plan) {
    return ApiResponse.error(res, "Membership plan not found", 404);
  }

  ApiResponse.success(res, { plan }, "Membership plan fetched successfully");
});

/**
 * @desc    Create new membership plan
 * @route   POST /api/memberships/plans
 * @access  Admin
 */
export const createPlan = asyncHandler(async (req, res) => {
  let {
    name,
    code,
    type,
    tier,
    description,
    price,
    durationMonths,
    discountPercentage,
    maxMembers,
    benefits,
    features,
    displayOrder,
  } = req.body;

  // Validation
  if (!name || !code || !type || !tier || price === undefined || discountPercentage === undefined) {
    return ApiResponse.error(res, "Name, code, type, tier, price and discount percentage are required", 400);
  }

  // Normalize
  name = name.trim();
  code = code.trim().toUpperCase();
  type = type.trim().toLowerCase();
  tier = tier.trim().toLowerCase();
  price = Number(price);
  discountPercentage = Number(discountPercentage);

  if (Number.isNaN(price) || Number.isNaN(discountPercentage)) {
    return ApiResponse.error(res, "Price and discount percentage must be numbers", 400);
  }

  // Check duplicate code
  const existing = await MembershipPlan.findOne({ code });
  if (existing) {
    return ApiResponse.error(res, "Membership plan with this code already exists", 409);
  }

  // Create plan
  const plan = await MembershipPlan.create({
    name,
    code,
    type,
    tier,
    description,
    price,
    durationMonths: durationMonths ? Number(durationMonths) : 12,
    discountPercentage,
    maxMembers: maxMembers ? Number(maxMembers) : (type === "family" ? 4 : 1),
    benefits: benefits || [],
    features: features || [],
    displayOrder: displayOrder ? Number(displayOrder) : 0,
  });

  ApiResponse.created(res, { plan }, "Membership plan created successfully");
});

/**
 * @desc    Update membership plan
 * @route   PATCH /api/memberships/plans/:id
 * @access  Admin
 */
export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid plan ID", 400);
  }

  const plan = await MembershipPlan.findById(id);

  if (!plan) {
    return ApiResponse.error(res, "Membership plan not found", 404);
  }

  // Update allowed fields
  const allowedFields = [
    "name",
    "description",
    "price",
    "durationMonths",
    "discountPercentage",
    "maxMembers",
    "benefits",
    "features",
    "displayOrder",
    "isActive",
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      plan[field] = req.body[field];
    }
  });

  await plan.save();

  ApiResponse.success(res, { plan }, "Membership plan updated successfully");
});

/**
 * @desc    Delete (deactivate) membership plan
 * @route   DELETE /api/memberships/plans/:id
 * @access  Admin
 */
export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid plan ID", 400);
  }

  const plan = await MembershipPlan.findById(id);

  if (!plan) {
    return ApiResponse.error(res, "Membership plan not found", 404);
  }

  // Soft delete
  plan.isActive = false;
  await plan.save();

  ApiResponse.success(res, null, "Membership plan deactivated successfully");
});

/**
 * @desc    Seed default membership plans
 * @route   POST /api/memberships/plans/seed
 * @access  Admin
 */
export const seedDefaultPlans = asyncHandler(async (req, res) => {
  await MembershipPlan.seedDefaultPlans();

  const plans = await MembershipPlan.find({ isActive: true }).sort({ displayOrder: 1 });

  ApiResponse.success(res, { plans }, "Default membership plans seeded successfully");
});

// ==================== PATIENT MEMBERSHIPS ====================

/**
 * @desc    Assign membership to patient
 * @route   POST /api/memberships/assign
 * @access  Admin
 */
export const assignMembership = asyncHandler(async (req, res) => {
  const { patientId, planId, paymentId } = req.body;

  // Validation
  if (!patientId || !planId) {
    return ApiResponse.error(res, "Patient ID and Plan ID are required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return ApiResponse.error(res, "Invalid patient ID", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(planId)) {
    return ApiResponse.error(res, "Invalid plan ID", 400);
  }

  // Get patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Get plan
  const plan = await MembershipPlan.findById(planId);
  if (!plan) {
    return ApiResponse.error(res, "Membership plan not found", 404);
  }

  if (!plan.isActive) {
    return ApiResponse.error(res, "This membership plan is no longer available", 400);
  }

  // Check if patient already has active membership
  if (patient.hasMembership) {
    return ApiResponse.error(
      res,
      "Patient already has an active membership. Please cancel or let it expire first.",
      400
    );
  }

  // Calculate dates
  const startDate = new Date();
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

  // If patient has old membership, move it to history
  if (patient.membership && patient.membership.plan) {
    patient.membershipHistory.push({
      ...patient.membership.toObject(),
      status: "expired",
    });
  }

  // Assign new membership
  patient.membership = {
    plan: plan._id,
    planName: plan.name,
    discountPercent: plan.discountPercentage,
    startDate,
    expiryDate,
    status: "active",
  };

  await patient.save();

  // Populate membership plan for response
  await patient.populate("membership.plan");

  ApiResponse.success(
    res,
    {
      patient: {
        _id: patient._id,
        name: patient.name,
        phone: patient.phone,
        membership: patient.membership,
        hasMembership: patient.hasMembership,
        currentDiscount: patient.currentDiscount,
      },
      paymentId,
    },
    "Membership assigned successfully"
  );
});

/**
 * @desc    Renew patient's membership
 * @route   POST /api/memberships/renew/:patientId
 * @access  Admin
 */
export const renewMembership = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { planId, paymentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return ApiResponse.error(res, "Invalid patient ID", 400);
  }

  // Get patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Check if patient has membership to renew
  if (!patient.membership || !patient.membership.plan) {
    return ApiResponse.error(res, "Patient does not have a membership to renew", 400);
  }

  // Get plan (use new plan if provided, otherwise use current plan)
  const planToUse = planId || patient.membership.plan;
  const plan = await MembershipPlan.findById(planToUse);
  if (!plan) {
    return ApiResponse.error(res, "Membership plan not found", 404);
  }

  if (!plan.isActive) {
    return ApiResponse.error(res, "This membership plan is no longer available", 400);
  }

  // Move current membership to history
  patient.membershipHistory.push({
    ...patient.membership.toObject(),
    status: patient.membership.status,
  });

  // Calculate new dates
  // If membership is still active, extend from expiry date
  // If expired, start from today
  let startDate;
  if (patient.hasMembership) {
    startDate = new Date(patient.membership.expiryDate);
  } else {
    startDate = new Date();
  }

  const expiryDate = new Date(startDate);
  expiryDate.setMonth(expiryDate.getMonth() + plan.durationMonths);

  // Update membership
  patient.membership = {
    plan: plan._id,
    planName: plan.name,
    discountPercent: plan.discountPercentage,
    startDate,
    expiryDate,
    status: "active",
  };

  await patient.save();

  // Populate membership plan for response
  await patient.populate("membership.plan");

  ApiResponse.success(
    res,
    {
      patient: {
        _id: patient._id,
        name: patient.name,
        phone: patient.phone,
        membership: patient.membership,
        hasMembership: patient.hasMembership,
        currentDiscount: patient.currentDiscount,
      },
      paymentId,
    },
    "Membership renewed successfully"
  );
});

/**
 * @desc    Cancel patient's membership
 * @route   POST /api/memberships/cancel/:patientId
 * @access  Admin
 */
export const cancelMembership = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return ApiResponse.error(res, "Invalid patient ID", 400);
  }

  // Get patient
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Check if patient has active membership
  if (!patient.membership || !patient.membership.plan) {
    return ApiResponse.error(res, "Patient does not have an active membership", 400);
  }

  if (patient.membership.status === "cancelled") {
    return ApiResponse.error(res, "Membership is already cancelled", 400);
  }

  // Move current membership to history with cancelled status
  patient.membershipHistory.push({
    ...patient.membership.toObject(),
    status: "cancelled",
  });

  // Clear current membership
  patient.membership = undefined;

  await patient.save();

  ApiResponse.success(
    res,
    {
      patient: {
        _id: patient._id,
        name: patient.name,
        phone: patient.phone,
        hasMembership: false,
        currentDiscount: 0,
      },
      reason,
    },
    "Membership cancelled successfully"
  );
});

/**
 * @desc    Get all members (patients with active membership)
 * @route   GET /api/memberships/members
 * @access  Admin
 */
export const getActiveMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, plan, expiringSoon } = req.query;

  // Build query
  const query = {
    "membership.status": "active",
    "membership.expiryDate": { $gt: new Date() },
  };

  if (plan && mongoose.Types.ObjectId.isValid(plan)) {
    query["membership.plan"] = plan;
  }

  // Expiring soon = within 30 days
  if (expiringSoon === "true") {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    query["membership.expiryDate"] = {
      $gt: new Date(),
      $lte: thirtyDaysFromNow,
    };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [members, total] = await Promise.all([
    Patient.find(query)
      .select("name phone email membership")
      .populate("membership.plan", "name code type tier")
      .sort({ "membership.expiryDate": 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Patient.countDocuments(query),
  ]);

  ApiResponse.paginated(res, members, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * @desc    Get membership statistics
 * @route   GET /api/memberships/stats
 * @access  Admin
 */
export const getMembershipStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get counts
  const [activeCount, expiringCount, planStats] = await Promise.all([
    // Active members
    Patient.countDocuments({
      "membership.status": "active",
      "membership.expiryDate": { $gt: now },
    }),

    // Expiring within 30 days
    Patient.countDocuments({
      "membership.status": "active",
      "membership.expiryDate": { $gt: now, $lte: thirtyDaysFromNow },
    }),

    // Stats by plan
    Patient.aggregate([
      {
        $match: {
          "membership.status": "active",
          "membership.expiryDate": { $gt: now },
        },
      },
      {
        $group: {
          _id: "$membership.plan",
          count: { $sum: 1 },
          planName: { $first: "$membership.planName" },
        },
      },
    ]),
  ]);

  ApiResponse.success(
    res,
    {
      stats: {
        totalActiveMembers: activeCount,
        expiringWithin30Days: expiringCount,
        byPlan: planStats,
      },
    },
    "Membership statistics fetched successfully"
  );
});
