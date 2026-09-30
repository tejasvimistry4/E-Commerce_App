import { Request, Response, NextFunction } from "express";
import { notificationService } from "./notification.service";

export class NotificationController {
  /**
   * GET /api/notifications
   * Get paginated notifications for current user
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const result = await notificationService.getUserNotifications(userId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Get unread notifications count for badge
   */
  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const count = await notificationService.getUnreadCount(userId);
      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const id = String(req.params.id);

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const updated = await notificationService.markAsRead(userId, id);
      res.status(200).json({
        success: true,
        message: "Notification marked as read.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/notifications/mark-all-read
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const result = await notificationService.markAllAsRead(userId);
      res.status(200).json({
        success: true,
        message: "All notifications marked as read.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete single notification
   */
  async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const id = String(req.params.id);

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const result = await notificationService.deleteNotification(userId, id);
      res.status(200).json({
        success: true,
        message: "Notification deleted successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notifications
   * Clear all notifications for current user
   */
  async clearAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      const result = await notificationService.clearAllNotifications(userId);
      res.status(200).json({
        success: true,
        message: "All notifications cleared.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
export default notificationController;
