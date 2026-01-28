import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Appointment from "./appointment.model.js";
import Patient from "../patients/patient.model.js";
import mongoose from "mongoose";
/**
 * APPOINTMENT CONTROLLER
 * Handles appointment booking and management
 */

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments?date=&clinic=&status=
 * @access  Admin
 */
export const getAllAppointments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, date, clinic, status } = req.query;

  // 1. Build filter query from params
  const filter = {};

  if (clinic && mongoose.Types.ObjectId.isValid(clinic)) {
    filter.clinic = clinic;
  }

  if (status) {
    filter.status = status;
  }

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    filter.date = { $gte: start, $lte: end };
  }

  // 2. Query appointments with pagination
  const skip = (Number(page) - 1) * Number(limit);

  const [appointments, total] = await Promise.all([
    Appointment.find(filter)
      .populate("patient", "name phone")
      .populate("clinic", "name code")
      .sort({ date: -1, timeSlot: 1 })
      .skip(skip)
      .limit(Number(limit)),
    Appointment.countDocuments(filter),
  ]);

  // 3. Pagination info
  const pagination = {
    page: Number(page),
    limit: Number(limit),
    total,
    totalPages: Math.ceil(total / limit),
  };

  // 4. Return paginated list
  ApiResponse.paginated(res, appointments, pagination, "Appointments fetched");
});

/**
 * @desc    Get today's appointments
 * @route   GET /api/appointments/today?clinic=
 * @access  Admin
 */
export const getTodayAppointments = asyncHandler(async (req, res) => {
  // 1️⃣ Get current date
  const today = new Date();

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  // 2️⃣ Query appointments for today (FIXED FIELD)
  const appointments = await Appointment.find({
    date: { $gte: startOfDay, $lte: endOfDay }, // ✅ FIX HERE
    status: { $ne: "cancelled" },
  })
    // 3️⃣ Sort by time slot / token
    .sort({ tokenNumber: 1 })
    .populate("patient", "name phone")
    .populate("clinic", "name");

  // 4️⃣ Return list
  ApiResponse.success(res, appointments, "Today's appointments fetched");
});

/**
 * @desc    Get upcoming appointments
 * @route   GET /api/appointments/upcoming
 * @access  Admin
 */
export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  // 1. Get date range (today + days)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Number(days));
  futureDate.setHours(23, 59, 59, 999);

  // 2. Query appointments in range
  const appointments = await Appointment.find({
    date: { $gte: today, $lte: futureDate },
    status: "scheduled",
  })
    .populate("patient", "name phone")
    .populate("clinic", "name")
    .sort({ date: 1, timeSlot: 1 });

  // 3. Return list
  ApiResponse.success(res, appointments, "Upcoming appointments fetched");
});

/**
 * @desc    Get available slots
 * @route   GET /api/appointments/available-slots?clinic=&date=
 * @access  Public
 */
// export const getAvailableSlots = asyncHandler(async (req, res) => {
//   const { clinic, date } = req.query;

//   // TODO: Implement get available slots
//   // 1. Get clinic operating hours
//   // 2. Generate all slots (30 min intervals)
//   // 3. Get booked appointments
//   // 4. Filter out booked slots
//   // 5. If today, filter past slots
//   // 6. Return available slots

//   const slots = {
//     date,
//     clinic,
//     available: [],
//     message: "Available slots fetched",
//   };

//   ApiResponse.success(res, slots, "Slots fetched successfully");
// });

/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Admin
 */
/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Admin
 */
/**
 * @desc    Get appointment by ID
 * @route   GET /api/appointments/:id
 * @access  Admin
 */
export const getAppointmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(id)
    .populate("patient", "name phone email hasMembership currentDiscount")
    .populate("clinic", "name code address")
    .populate("createdBy", "name");

  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  ApiResponse.success(res, { appointment }, "Appointment fetched successfully");
});

/**
 * @desc    Get appointments by phone number
 * @route   GET /api/appointments/phone/:phone
 * @access  Admin
 */
export const getAppointmentsByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.params;

  // 1. Find patient by phone
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // 2. Find appointments for this patient
  const appointments = await Appointment.find({ patient: patient._id })
    .populate("patient", "name phone")
    .populate("clinic", "name code")
    .populate("createdBy", "name")
    .sort({ date: -1 });

  if (!appointments.length) {
    return ApiResponse.error(res, "No appointments found", 404);
  }

  ApiResponse.success(res, { appointments }, "Appointments fetched successfully");
});

/**
 * @desc    Create new appointment (book)
 * @route   POST /api/appointments
 * @access  Admin / Patient
 */

export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, name, phone, clinic, date, timeSlot, reason, type } =
    req.body;

  /* =======================
     BASIC VALIDATIONS
  ======================== */

  if (!clinic || !date || !timeSlot || !phone) {
    return ApiResponse.error(
      res,
      "Clinic, date and time slot are required",
      400,
    );
  }

  if (!reason) {
    return ApiResponse.error(res, "Reason for visit is required", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(clinic)) {
    return ApiResponse.error(res, "Invalid clinic ID", 400);
  }

  /* =======================
     PATIENT HANDLING
  ======================== */

  let patient;

  // Case 1: Existing patient
  if (patientId) {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return ApiResponse.error(res, "Invalid patient ID", 400);
    }

    patient = await Patient.findById(patientId);
    if (!patient) {
      return ApiResponse.error(res, "Patient not found", 404);
    }
  }

  // Case 2: New patient
  if (!patientId) {
    if (!name || !phone) {
      return ApiResponse.error(
        res,
        "Name and phone are required for new patient",
        400,
      );
    }

    patient = await Patient.findOne({ phone });

    if (!patient) {
      patient = await Patient.create({
        name,
        phone,
        registeredBy: req.user?._id,
      });
    }
  }

  /* =======================
     SLOT AVAILABILITY CHECK
  ======================== */

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const slotBooked = await Appointment.findOne({
    clinic,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot,
    status: { $ne: "cancelled" },
  });

  if (slotBooked) {
    return ApiResponse.error(res, "Time slot already booked", 409);
  }

  /* =======================
     OPD FEE CALCULATION
  ======================== */

  let opdFee = type === "emergency" ? 500 : 300;

  /* =======================
     CREATE APPOINTMENT
     (NO status, NO tokenNumber)
     → schema handles them
  ======================== */

  const appointment = await Appointment.create({
    patient: patient._id,
    clinic,
    date,
    timeSlot,
    reason,
    type,
    opdFee,
    createdBy: req.user?._id,
    // ❌ DO NOT set status
    // ❌ DO NOT set tokenNumber
  });

  /* =======================
     RESPONSE
  ======================== */

  return ApiResponse.created(
    res,
    {
      appointmentId: appointment._id,
      appointmentNumber: appointment.appointmentNumber,
      tokenNumber: appointment.tokenNumber,
      status: appointment.status,
      opdFee: appointment.opdFee,
      patient: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
      },
    },
    "Appointment created successfully",
  );
});

/**
 * @desc    Update appointment details
 * @route   PATCH /api/appointments/:id
 * @access  Admin
 */
export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  // 1️⃣ Find appointment
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  const {
    patient,
    clinic,
    date,
    timeSlot,
    type,
    status,
    reason,
    notes,
    opdFee,
    opdFeePaid,
    source,
    checkInTime,
    startTime,
    endTime,
  } = req.body;

  /* =======================
     SLOT CONFLICT CHECK
     (only if date or timeSlot changes)
  ======================== */
  if (date || timeSlot) {
    const newDate = date || appointment.date;
    const newTimeSlot = timeSlot || appointment.timeSlot;

    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      clinic: appointment.clinic,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: newTimeSlot,
      status: { $ne: "cancelled" },
    });

    if (conflict) {
      return ApiResponse.error(res, "Time slot already booked", 409);
    }

    appointment.date = newDate;
    appointment.timeSlot = newTimeSlot;
  }

  /* =======================
     DIRECT FIELD UPDATES
     (Appointment only)
  ======================== */
  if (patient !== undefined) appointment.patient = patient;
  if (clinic !== undefined) appointment.clinic = clinic;
  if (type !== undefined) appointment.type = type;
  if (status !== undefined) appointment.status = status;
  if (reason !== undefined) appointment.reason = reason;
  if (notes !== undefined) appointment.notes = notes;
  if (opdFee !== undefined) appointment.opdFee = opdFee;
  if (opdFeePaid !== undefined) appointment.opdFeePaid = opdFeePaid;
  if (source !== undefined) appointment.source = source;

  if (checkInTime !== undefined) appointment.checkInTime = checkInTime;
  if (startTime !== undefined) appointment.startTime = startTime;
  if (endTime !== undefined) appointment.endTime = endTime;

  /* =======================
     SAVE
  ======================== */
  await appointment.save();

  /* =======================
     RESPONSE
  ======================== */
  const updatedAppointment = await Appointment.findById(id)
    .populate("patient")
    .populate("clinic")
    .populate("createdBy", "name");

  ApiResponse.success(
    res,
    updatedAppointment,
    "Appointment updated successfully",
  );
});

/**
 * @desc    Update appointment status
 * @route   PATCH /api/appointments/:id/status
 * @access  Admin
 */
export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  // Allowed transitions
  const allowedTransitions = {
    scheduled: ["confirmed", "cancelled"],
    confirmed: ["checked_in", "cancelled", "no_show"],
    checked_in: ["in_progress", "cancelled"],
    in_progress: ["completed"],
    completed: [],
    cancelled: [],
    no_show: [],
  };

  if (!allowedTransitions[appointment.status]?.includes(status)) {
    return ApiResponse.error(
      res,
      `Invalid status transition from ${appointment.status} to ${status}`,
      400,
    );
  }

  appointment.status = status;

  appointment.statusHistory.push({
    status,
    reason,
    changedBy: req.user?._id,
  });

  await appointment.save();

  ApiResponse.success(
    res,
    appointment,
    "Appointment status updated successfully",
  );
});

/**
 * @desc    Check-in patient
 * @route   POST /api/appointments/:id/check-in
 * @access  Admin
 */
export const checkIn = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  // Must be confirmed or scheduled
  if (!["scheduled", "confirmed"].includes(appointment.status)) {
    return ApiResponse.error(res, "Appointment cannot be checked in", 400);
  }

  // Verify appointment is today
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));

  if (appointment.date < start || appointment.date > end) {
    return ApiResponse.error(
      res,
      "Check-in allowed only for today's appointments",
      400,
    );
  }

  appointment.status = "checked_in";
  appointment.checkInTime = new Date();

  appointment.statusHistory.push({
    status: "checked_in",
    reason: "Patient arrived",
    changedBy: req.user?._id,
  });

  await appointment.save();

  ApiResponse.success(res, appointment, "Patient checked in successfully");
});

/**
 * @desc    Start appointment (begin treatment)
 * @route   POST /api/appointments/:id/start
 * @access  Admin
 */
export const startAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  if (appointment.status !== "checked_in") {
    return ApiResponse.error(res, "Patient must be checked in first", 400);
  }

  appointment.status = "in_progress";
  appointment.startTime = new Date();

  appointment.statusHistory.push({
    status: "in_progress",
    reason: "Treatment started",
    changedBy: req.user?._id,
  });

  await appointment.save();

  ApiResponse.success(res, { appointment }, "Appointment started successfully");
});

/**
 * @desc    Complete appointment
 * @route   POST /api/appointments/:id/complete
 * @access  Admin
 */
export const completeAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { clinicalNotes, prescriptions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  if (!["in_progress", "checked_in"].includes(appointment.status)) {
    return ApiResponse.error(res, "Appointment cannot be completed", 400);
  }

  appointment.status = "completed";
  appointment.endTime = new Date();

  // Store clinical info in notes (appointment-only rule)
  appointment.notes = [
    clinicalNotes && `Clinical Notes: ${clinicalNotes}`,
    prescriptions && `Prescriptions: ${prescriptions}`,
  ]
    .filter(Boolean)
    .join("\n");

  appointment.statusHistory.push({
    status: "completed",
    reason: "Treatment completed",
    changedBy: req.user?._id,
  });

  await appointment.save();

  ApiResponse.success(res, appointment, "Appointment completed successfully");
});

/**
 * @desc    Cancel appointment
 * @route   POST /api/appointments/:id/cancel
 * @access  Admin / Patient
 */
export const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // 1️⃣ Find appointment by ID
  const appointment = await Appointment.findById(id)
    .populate("patient", "name phone email")
    .populate("clinic", "name");

  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  // 2️⃣ Check if can be cancelled
  if (appointment.status === "cancelled") {
    return ApiResponse.error(res, "Appointment already cancelled", 400);
  }

  // 3️⃣ Update status to 'cancelled'
  appointment.status = "cancelled";

  // 4️⃣ Add cancellation reason
  appointment.cancellationReason = reason || "Cancelled by clinic";

  // 5️⃣ Send cancellation notification (placeholder)
  // sendAppointmentCancelledNotification(appointment);

  await appointment.save();

  // 6️⃣ Return success
  ApiResponse.success(res, appointment, "Appointment cancelled successfully");
});

/**
 * @desc    Reschedule appointment
 * @route   POST /api/appointments/:id/reschedule
 * @access  Admin / Patient
 */
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDate, newTimeSlot, reason } = req.body;

  /* =======================
     BASIC VALIDATION
  ======================== */

  if (!newDate || !newTimeSlot) {
    return ApiResponse.error(
      res,
      "New date and new time slot are required",
      400,
    );
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return ApiResponse.error(res, "Invalid appointment ID", 400);
  }

  /* =======================
     1. FIND APPOINTMENT
  ======================== */

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return ApiResponse.error(res, "Appointment not found", 404);
  }

  if (
    appointment.status === "cancelled" ||
    appointment.status === "completed"
  ) {
    return ApiResponse.error(
      res,
      "This appointment cannot be rescheduled",
      400,
    );
  }

  /* =======================
     2. CHECK SLOT AVAILABILITY
  ======================== */

  const startOfDay = new Date(newDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(newDate);
  endOfDay.setHours(23, 59, 59, 999);

  const slotAlreadyBooked = await Appointment.findOne({
    _id: { $ne: appointment._id }, // exclude same appointment
    clinic: appointment.clinic,
    date: { $gte: startOfDay, $lte: endOfDay },
    timeSlot: newTimeSlot,
    status: { $ne: "cancelled" },
  });

  if (slotAlreadyBooked) {
    return ApiResponse.error(res, "Selected time slot is already booked", 409);
  }

  /* =======================
     3. UPDATE DATE & TIME
  ======================== */

  appointment.date = newDate;
  appointment.timeSlot = newTimeSlot;
  appointment.status = "scheduled"; // reset to scheduled

  if (reason) {
    appointment.notes = `Rescheduled: ${reason}`;
  }

  await appointment.save(); // pre-save will regenerate tokenNumber

  /* =======================
     4. RESPONSE
  ======================== */

  ApiResponse.success(res, appointment, "Appointment rescheduled successfully");
});
