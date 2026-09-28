import { Router } from "express";
import { notificationController } from "./notification.controller";
import { authenticate } from "../../middleware/auth.middleware";

const router = Router();

// All notification endpoints require authenticated session
router.use(authenticate);

// 1. Get paginated notifications
router.get("/", (req, res, next) => notificationController.getNotifications(req, res, next));

// 2. Get unread notification count
router.get("/unread-count", (req, res, next) => notificationController.getUnreadCount(req, res, next));

// 3. Mark all notifications as read
router.patch("/mark-all-read", (req, res, next) => notificationController.markAllAsRead(req, res, next));

// 4. Mark single notification as read
router.patch("/:id/read", (req, res, next) => notificationController.markAsRead(req, res, next));

// 5. Clear all notifications
router.delete("/", (req, res, next) => notificationController.clearAll(req, res, next));

// 6. Delete single notification
router.delete("/:id", (req, res, next) => notificationController.deleteNotification(req, res, next));

export default router;
