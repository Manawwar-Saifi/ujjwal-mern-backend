import jwt from "jsonwebtoken";
import crypto from "crypto";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import User from "../users/user.model.js";
import Patient from "../patients/patient.model.js";

/**
 * AUTH CONTROLLER
 *
 * Handles all authentication operations:
 * - Admin/Staff login with email & password
 * - Patient login with phone & OTP
 * - Token refresh
 * - Password reset
 */

// Helper function to generate JWT token
const generateToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// ===========================================
// ADMIN/STAFF AUTHENTICATION
// ===========================================

/**
 * @desc    Admin/Staff login
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return ApiResponse.error(res, "Please provide email and password", 400);
  }

  // Find user by email (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user) {
    return ApiResponse.error(res, "Invalid email or password", 401);
  }

  // Check if user is active
  if (!user.isActive) {
    return ApiResponse.error(res, "Your account has been deactivated", 401);
  }

  // Compare password
  const isPasswordMatch = await user.comparePassword(password);

  // Debug logging - remove in production
  // console.log("Password from request:", password);
  // console.log("Hashed password in DB:", user.password);
  console.log("Password match result:", isPasswordMatch);

  if (!isPasswordMatch) {
    return ApiResponse.error(res, "Invalid email or password", 401);
  }

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    id: user._id,
    role: user.role,
    type: "admin",
  });

  // Return user data (without password)
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  ApiResponse.success(res, { user: userData, token }, "Login successful");
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // User is already attached to req by auth middleware
  const user = await User.findById(req.user._id);

  if (!user) {
    return ApiResponse.error(res, "User not found", 404);
  }

  ApiResponse.success(res, { user }, "User data retrieved");
});

/**
 * @desc    Logout user (clear refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token if using refresh token mechanism
  if (req.user && req.user._id) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }

  ApiResponse.success(res, null, "Logged out successfully");
});

/**
 * @desc    Forgot password - Send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, "Please provide email", 400);
  }

  // Find user by email
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if user exists or not
    return ApiResponse.success(
      res,
      null,
      "If email exists, a reset link will be sent",
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token and save to database
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

  await user.save();

  // TODO: Send email with reset link
  // For now, just return the token (in production, send via email)
  console.log(`Password reset token for ${email}: ${resetToken}`);

  ApiResponse.success(res, null, "If email exists, a reset link will be sent");
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public (with reset token)
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return ApiResponse.error(res, "Please provide token and new password", 400);
  }

  // Validate password length
  if (newPassword.length < 6) {
    return ApiResponse.error(
      res,
      "Password must be at least 6 characters",
      400,
    );
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return ApiResponse.error(res, "Invalid or expired reset token", 400);
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  ApiResponse.success(res, null, "Password reset successful");
});

/**
 * @desc    Change password (when logged in)
 * @route   POST /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return ApiResponse.error(
      res,
      "Please provide current and new password",
      400,
    );
  }

  // Get user with password
  const user = await User.findById(req.user._id).select("+password");

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return ApiResponse.error(res, "Current password is incorrect", 401);
  }

  // Validate new password
  if (newPassword.length < 6) {
    return ApiResponse.error(
      res,
      "New password must be at least 6 characters",
      400,
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();

  ApiResponse.success(res, null, "Password changed successfully");
});

// ===========================================
// PATIENT AUTHENTICATION (OTP BASED)
// ===========================================

/**
 * @desc    Patient login - Send OTP
 * @route   POST /api/auth/patient/login
 * @access  Public
 */
export const patientLogin = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return ApiResponse.error(res, "Please provide phone number", 400);
  }

  // Validate phone format (10 digits for India)
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(phone)) {
    return ApiResponse.error(
      res,
      "Please provide a valid 10-digit phone number",
      400,
    );
  }

  // Find patient by phone
  let patient = await Patient.findOne({ phone });

  if (!patient) {
    // Patient doesn't exist - they need to register first
    return ApiResponse.error(
      res,
      "Patient not found. Please register first.",
      404,
    );
  }

  // Check if patient is active
  if (!patient.isActive) {
    return ApiResponse.error(res, "Your account has been deactivated", 401);
  }

  // Generate OTP
  const otp = patient.generateOTP();
  await patient.save();

  // TODO: Send OTP via SMS
  // For development, we'll log it to console
  console.log(`OTP for ${phone}: ${otp}`);

  ApiResponse.success(
    res,
    { phone, otpSent: true },
    "OTP sent to your phone number",
  );
});

/**
 * @desc    Verify OTP for patient
 * @route   POST /api/auth/patient/verify-otp
 * @access  Public
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    return ApiResponse.error(res, "Please provide phone and OTP", 400);
  }

  // Find patient by phone
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Verify OTP
  const isValid = patient.verifyOTP(otp);

  if (!isValid) {
    return ApiResponse.error(res, "Invalid or expired OTP", 400);
  }

  // Clear OTP after successful verification
  patient.clearOTP();
  await patient.save();

  // Generate token
  const token = generateToken({
    id: patient._id,
    type: "patient",
  });

  // Return patient data
  const patientData = {
    _id: patient._id,
    name: patient.name,
    phone: patient.phone,
    email: patient.email,
    hasMembership: patient.hasMembership,
  };

  ApiResponse.success(
    res,
    { patient: patientData, token },
    "OTP verified successfully",
  );
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/patient/resend-otp
 * @access  Public
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return ApiResponse.error(res, "Please provide phone number", 400);
  }

  // Find patient by phone
  const patient = await Patient.findOne({ phone });

  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  // Generate new OTP
  const otp = patient.generateOTP();
  await patient.save();

  // TODO: Send OTP via SMS
  console.log(`Resent OTP for ${phone}: ${otp}`);

  ApiResponse.success(res, { phone, otpSent: true }, "OTP resent successfully");
});

/**
 * @desc    Get current logged in patient
 * @route   GET /api/auth/patient/me
 * @access  Private (Patient)
 */
export const getPatientMe = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.patient._id).populate(
    "preferredClinic",
    "name code",
  );

  if (!patient) {
    return ApiResponse.error(res, "Patient not found", 404);
  }

  ApiResponse.success(res, { patient }, "Patient data retrieved");
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return ApiResponse.error(res, "Refresh token is required", 400);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );

    // Generate new access token
    const newAccessToken = generateToken(
      {
        id: decoded.id,
        role: decoded.role,
        type: decoded.type,
      },
      "15m", // Short lived access token
    );

    ApiResponse.success(
      res,
      { accessToken: newAccessToken },
      "Token refreshed",
    );
  } catch (error) {
    return ApiResponse.error(res, "Invalid refresh token", 401);
  }
});
