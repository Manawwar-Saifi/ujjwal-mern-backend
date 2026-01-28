import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Base Application Error Class
 * All custom errors extend from this class
 */
export class AppError extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Operational errors are expected (validation, not found, etc.)
    this.errors = errors; // For validation errors array

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 - Bad Request
 * Use when request is malformed or invalid
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, HTTP_STATUS.BAD_REQUEST);
  }
}

/**
 * 400 - Validation Error
 * Use when request validation fails (Zod, Mongoose validation)
 */
export class ValidationError extends AppError {
  constructor(errors = [], message = 'Validation failed') {
    super(message, HTTP_STATUS.BAD_REQUEST, errors);
  }
}

/**
 * 401 - Unauthorized
 * Use when authentication is required but not provided or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Not authenticated') {
    super(message, HTTP_STATUS.UNAUTHORIZED);
  }
}

/**
 * 403 - Forbidden
 * Use when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, HTTP_STATUS.FORBIDDEN);
  }
}

/**
 * 404 - Not Found
 * Use when requested resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND);
  }
}

/**
 * 409 - Conflict
 * Use when resource already exists or concurrent modification
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * 409 - Slot Unavailable
 * Specific error for appointment slot conflicts
 */
export class SlotUnavailableError extends AppError {
  constructor(message = 'Selected time slot is no longer available') {
    super(message, HTTP_STATUS.CONFLICT);
  }
}

/**
 * 402 - Payment Error
 * Use when payment processing fails
 */
export class PaymentError extends AppError {
  constructor(message = 'Payment processing failed') {
    super(message, HTTP_STATUS.PAYMENT_REQUIRED);
  }
}

/**
 * 429 - Too Many Requests
 * Use when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, HTTP_STATUS.TOO_MANY_REQUESTS);
  }
}

/**
 * 500 - Internal Server Error
 * Use for unexpected server errors
 */
export class InternalError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    this.isOperational = false; // Programming errors are not operational
  }
}
