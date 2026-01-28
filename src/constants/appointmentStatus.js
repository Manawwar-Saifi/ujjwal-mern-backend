/**
 * Appointment Status Constants
 */
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  RESCHEDULED: 'rescheduled',
};

export const APPOINTMENT_TYPES = {
  REGULAR: 'regular',
  EMERGENCY: 'emergency',
  FOLLOW_UP: 'follow_up',
};

export const OPD_FEE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  WAIVED: 'waived',
};

// Statuses that indicate slot is taken
export const ACTIVE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.SCHEDULED,
  APPOINTMENT_STATUS.CHECKED_IN,
  APPOINTMENT_STATUS.IN_PROGRESS,
  APPOINTMENT_STATUS.COMPLETED,
];

// Statuses that free up the slot
export const INACTIVE_APPOINTMENT_STATUSES = [
  APPOINTMENT_STATUS.CANCELLED,
  APPOINTMENT_STATUS.RESCHEDULED,
];
