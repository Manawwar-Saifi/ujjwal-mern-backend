import { Router } from "express";
import * as notificationController from "./notification.controller.js";
import { authProtect, anyAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * NOTIFICATION ROUTES
 * Base path: /api/notifications
 *
 * Notification types:
 * - Appointment confirmation, reminder, cancellation
 * - Payment received, reminder
 * - Report uploaded
 * - Membership activated, expiry reminder
 * - Follow-up reminder
 *
 * Channels: App (in-app), Email, SMS
 */

// ==================== USER NOTIFICATIONS ====================

// Get all notifications for current user (Admin or Patient)
router.get("/", anyAuth, notificationController.getAllNotifications);

// Get unread count
router.get("/unread-count", anyAuth, notificationController.getUnreadCount);

// Get unread notifications only
router.get("/unread", anyAuth, notificationController.getUnreadNotifications);

// Get single notification by ID
router.get("/:id", anyAuth, notificationController.getNotificationById);

// Mark single notification as read
router.patch("/:id/read", anyAuth, notificationController.markAsRead);

// Mark single notification as unread
router.patch("/:id/unread", anyAuth, notificationController.markAsUnread);

// Mark all notifications as read
router.patch("/mark-all-read", anyAuth, notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", anyAuth, notificationController.deleteNotification);

// ==================== ADMIN OPERATIONS ====================

// Get all notifications (Admin view - all users)
router.get("/admin/all", authProtect, notificationController.getAllNotificationsAdmin);

// Get notification statistics
router.get("/admin/stats", authProtect, notificationController.getNotificationStats);

// Send notification manually (Admin)
router.post("/send", authProtect, notificationController.sendNotification);

// Send bulk notifications (Admin)
router.post("/send-bulk", authProtect, notificationController.sendBulkNotifications);

// Create appointment reminder notification
router.post("/reminder/appointment", authProtect, notificationController.createAppointmentReminder);

// Create payment reminder notification
router.post("/reminder/payment", authProtect, notificationController.createPaymentReminder);

export default router;
