import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { TreatmentMaster, Treatment } from "./treatment.model.js";
import Patient from "../patients/patient.model.js";
import mongoose from "mongoose";

/**
 * TREATMENT CONTROLLER
 *
 * Handles:
 * - Treatment Master (catalog of available treatments)
 * - Treatment Instances (actual treatments given to patients)
 */

// ==================== TREATMENT MASTER (Catalog)What it represents 👉 A static catalog of all treatments your clinic offers. ====================

/**
 * @desc    Get all treatment types (catalog)
 * @route   GET /api/treatments/master
 * @access  Public
 */
export const getAllTreatmentTypes = asyncHandler(async (req, res) => {
  const { active = "true", category, sort = "name", order = "asc" } = req.query;

  // Build filter
  const filter = {};
  if (active === "true") {
    filter.isActive = true;
  }
  if (category) {
    filter.category = category;
  }

  // Sort options
  const sortOptions = {};
  const sortOrder = order === "desc" ? -1 : 1;
  const allowedSortFields = ["name", "price", "createdAt"];

  if (allowedSortFields.includes(sort)) {
    sortOptions[sort] = sortOrder;
  } else {
    sortOptions.name = 1;
  }

  // Query database
  const treatmentTypes = await TreatmentMaster.find(filter).sort(sortOptions);

  ApiResponse.success(res, { treatmentTypes }, "Treatment types fetched successfully");
});

/**
 * @desc    Get treatment type by ID
 * @route   GET /api/treatments/master/:id
 * @access  Public
 */
export const getTreatmentTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment type ID", 400);
  }

  const treatmentType = await TreatmentMaster.findById(id);

  if (!treatmentType) {
    return ApiResponse.error(res, "Treatment type not found", 404);
  }

  ApiResponse.success(res, { treatmentType }, "Treatment type fetched successfully");
});

/**
 * @desc    Create new treatment type
 * @route   POST /api/treatments/master
 * @access  Admin
 */
export const createTreatmentType = asyncHandler(async (req, res) => {
  let { name, code, category, description, price, duration, sessionsRequired } = req.body;

  // Validation
  if (!name || !code || !category || price === undefined) {
    return ApiResponse.error(res, "Name, code, category and price are required", 400);
  }

  // Normalize
  name = name.trim();
  code = code.trim().toUpperCase();
  category = category.trim().toLowerCase();
  price = Number(price);

  if (Number.isNaN(price)) {
    return ApiResponse.error(res, "Price must be a number", 400);
  }

  // Check duplicate code
  const existing = await TreatmentMaster.findOne({ code });
  if (existing) {
    return ApiResponse.error(res, "Treatment type with this code already exists", 409);
  }

  // Create treatment type
  const treatmentType = await TreatmentMaster.create({
    name,
    code,
    category,
    description,
    price,
    duration: duration ? Number(duration) : 30,
    sessionsRequired: sessionsRequired ? Number(sessionsRequired) : 1,
  });

  ApiResponse.created(res, { treatmentType }, "Treatment type created successfully");
});

/**
 * @desc    Update treatment type
 * @route   PATCH /api/treatments/master/:id
 * @access  Admin
 */
export const updateTreatmentType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment type ID", 400);
  }

  const treatmentType = await TreatmentMaster.findById(id);

  if (!treatmentType) {
    return ApiResponse.error(res, "Treatment type not found", 404);
  }

  // Update allowed fields
  const allowedFields = ["name", "description", "price", "duration", "sessionsRequired", "isActive"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      treatmentType[field] = req.body[field];
    }
  });

  await treatmentType.save();

  ApiResponse.success(res, { treatmentType }, "Treatment type updated successfully");
});

/**
 * @desc    Delete (deactivate) treatment type
 * @route   DELETE /api/treatments/master/:id
 * @access  Admin
 */
export const deleteTreatmentType = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment type ID", 400);
  }

  const treatmentType = await TreatmentMaster.findById(id);

  if (!treatmentType) {
    return ApiResponse.error(res, "Treatment type not found", 404);
  }

  // Soft delete
  treatmentType.isActive = false;
  await treatmentType.save();

  ApiResponse.success(res, null, "Treatment type deactivated successfully");
});

// ==================== TREATMENT INSTANCES What it represents 👉 One specific patient’s treatment====================

/**
 * @desc    Get all treatment instances
 * @route   GET /api/treatments?patient=&status=
 * @access  Admin
 */
export const getAllTreatments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, patient, status, clinic } = req.query;

  // Build query
  const query = {};

  if (patient && mongoose.Types.ObjectId.isValid(patient)) {
    query.patient = patient;
  }

  if (status) {
    query.status = status;
  }

  if (clinic && mongoose.Types.ObjectId.isValid(clinic)) {
    query.clinic = clinic;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [treatments, total] = await Promise.all([
    Treatment.find(query)
      .populate("patient", "name phone")
      .populate("treatmentType", "name code category price")
      .populate("clinic", "name code")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Treatment.countDocuments(query),
  ]);

  ApiResponse.paginated(res, treatments, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * @desc    Get treatment by ID
 * @route   GET /api/treatments/:id
 * @access  Admin
 */
export const getTreatmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  const treatment = await Treatment.findById(id)
    .populate("patient", "name phone email hasMembership currentDiscount")
    .populate("treatmentType", "name code category price duration")
    .populate("clinic", "name code")
    .populate("appointment")
    .populate("createdBy", "name")
    .populate("sessions.performedBy", "name");

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  ApiResponse.success(res, { treatment }, "Treatment fetched successfully");
});

/**
 * @desc    Create treatment for patient
 * @route   POST /api/treatments
 * @access  Admin
 */
export const createTreatment = asyncHandler(async (req, res) => {
  const {
    treatmentType,
    patient,
    clinic,
    appointment,
    teeth,
    price,
    diagnosis,
    treatmentPlan,
    notes,
    totalSessions,
  } = req.body;

  // Validation
  if (!treatmentType || !patient || !clinic) {
    return ApiResponse.error(res, "Treatment type, patient and clinic are required", 400);
  }

  // Verify treatment type exists
  const treatmentMaster = await TreatmentMaster.findById(treatmentType);
  if (!treatmentMaster) {
    return ApiResponse.error(res, "Treatment type not found", 404);
  }

  // Verify patient exists
  const patientDoc = await Patient.findById(patient);
  if (!patientDoc) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Calculate price with membership discount
  let finalPrice = price || treatmentMaster.price;
  let discountPercentage = 0;
  let discountReason = "";

  if (patientDoc.hasMembership) {
    discountPercentage = patientDoc.currentDiscount || 0;
    discountReason = "Membership discount";
  }

  // Create treatment
  const treatment = await Treatment.create({
    treatmentType,
    patient,
    clinic,
    appointment,
    teeth: teeth || [],
    price: finalPrice,
    discount: {
      percentage: discountPercentage,
      reason: discountReason,
    },
    diagnosis,
    treatmentPlan,
    notes,
    totalSessions: totalSessions || treatmentMaster.sessionsRequired,
    createdBy: req.user?._id,
  });

  // Populate for response
  const populatedTreatment = await Treatment.findById(treatment._id)
    .populate("treatmentType", "name code")
    .populate("patient", "name phone");

  ApiResponse.created(res, { treatment: populatedTreatment }, "Treatment created successfully");
});

/**
 * @desc    Update treatment instance
 * @route   PATCH /api/treatments/:id
 * @access  Admin
 */
export const updateTreatment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  // Update allowed fields
  const allowedFields = ["teeth", "diagnosis", "treatmentPlan", "notes", "price", "discount"];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      treatment[field] = req.body[field];
    }
  });

  await treatment.save();

  const updatedTreatment = await Treatment.findById(id)
    .populate("treatmentType", "name code")
    .populate("patient", "name phone");

  ApiResponse.success(res, { treatment: updatedTreatment }, "Treatment updated successfully");
});

/**
 * @desc    Update treatment status
 * @route   PATCH /api/treatments/:id/status
 * @access  Admin
 */
export const updateTreatmentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  if (!status) {
    return ApiResponse.error(res, "Status is required", 400);
  }

  const validStatuses = ["planned", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, "Invalid status", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  // Update status
  treatment.status = status;

  if (status === "in_progress" && !treatment.startDate) {
    treatment.startDate = new Date();
  }

  if (status === "completed") {
    treatment.completionDate = new Date();
    treatment.completedSessions = treatment.totalSessions;
  }

  await treatment.save();

  ApiResponse.success(res, { treatment }, "Treatment status updated successfully");
});

/**
 * @desc    Add session to treatment
 * @route   POST /api/treatments/:id/sessions
 * @access  Admin
 */
export const addSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date, notes, performedBy } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  // Add session using model method
  await treatment.addSession({
    date: date || new Date(),
    notes,
    performedBy: performedBy || req.user?._id,
    status: "completed",
  });

  const updatedTreatment = await Treatment.findById(id)
    .populate("treatmentType", "name")
    .populate("sessions.performedBy", "name");

  ApiResponse.success(res, { treatment: updatedTreatment }, "Session added successfully");
});

/**
 * @desc    Complete a session
 * @route   PATCH /api/treatments/:id/sessions/:sessionId/complete
 * @access  Admin
 */
export const completeSession = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params;
  const { notes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  await treatment.completeSession(sessionId, notes);

  ApiResponse.success(res, { treatment }, "Session completed successfully");
});

/**
 * @desc    Schedule follow-up for treatment
 * @route   POST /api/treatments/:id/follow-up
 * @access  Admin
 */
export const scheduleFollowUp = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { followUpDate } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  if (!followUpDate) {
    return ApiResponse.error(res, "Follow-up date is required", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  await treatment.scheduleFollowUp(new Date(followUpDate));

  ApiResponse.success(res, { treatment }, "Follow-up scheduled successfully");
});

/**
 * @desc    Cancel treatment
 * @route   POST /api/treatments/:id/cancel
 * @access  Admin
 */
export const cancelTreatment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid treatment ID", 400);
  }

  const treatment = await Treatment.findById(id);

  if (!treatment) {
    return ApiResponse.error(res, "Treatment not found", 404);
  }

  if (treatment.status === "completed") {
    return ApiResponse.error(res, "Cannot cancel a completed treatment", 400);
  }

  await treatment.cancel(reason || "Cancelled by admin");

  ApiResponse.success(res, { treatment }, "Treatment cancelled successfully");
});
