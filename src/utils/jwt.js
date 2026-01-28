import jwt from "jsonwebtoken";

/**
 * JWT UTILITY
 *
 * Simple helper functions for JWT operations
 * - Generate access token (short-lived)
 * - Generate refresh token (long-lived)
 * - Verify tokens
 */

// Get secrets from environment variables
const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "your-access-secret-key";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

// Token expiry times
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d"; // 7 days

/**
 * Generate Access Token
 * Short-lived token for API requests
 *
 * @param {Object} payload - Data to include in token (user id, role, etc.)
 * @returns {String} - JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Generate Refresh Token
 * Long-lived token for getting new access tokens
 *
 * @param {Object} payload - Data to include in token
 * @returns {String} - JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

/**
 * Generate both tokens at once
 * Convenient for login operations
 *
 * @param {Object} payload - Data to include in tokens
 * @returns {Object} - { accessToken, refreshToken }
 */
export const generateTokens = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Verify Access Token
 *
 * @param {String} token - The access token to verify
 * @returns {Object} - Decoded payload if valid
 * @throws {Error} - If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

/**
 * Verify Refresh Token
 *
 * @param {String} token - The refresh token to verify
 * @returns {Object} - Decoded payload if valid
 * @throws {Error} - If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

/**
 * Decode token without verification
 * Useful for reading expired token data
 *
 * @param {String} token - Any JWT token
 * @returns {Object|null} - Decoded payload or null
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
