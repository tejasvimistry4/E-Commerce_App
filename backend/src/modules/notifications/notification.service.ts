import { prisma } from "../../config/prisma";
import { NotificationType, Prisma } from "@prisma/client";
import { emailService } from "../../services/email.service";
import {
  NotificationFilterParams,
  NotificationListResponse,
  NotificationResponse,
} from "./notification.types";

export class NotificationService {
  /**
   * Helper: Format Notification for clean API response
   */
  private formatNotification(n: any): NotificationResponse {
    return {
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      data: n.data || null,
      isRead: n.isRead,
      readAt: n.readAt || null,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    };
  }

  /**
   * 1. Create a new In-App Notification
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    data?: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title: title.trim(),
          message: message.trim(),
          type,
          data: data || {},
        },
      });

      return this.formatNotification(notification);
    } catch (err) {
      console.error(`[NotificationService] Failed to create notification for user ${userId}:`, err);
      throw err;
    }
  }

  /**
   * 2. Get User Notifications with pagination and unread filter
   */
  async getUserNotifications(
    userId: string,
    params?: NotificationFilterParams
  ): Promise<NotificationListResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params?.limit) || 15));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
    };

    if (params?.unreadOnly === true || params?.unreadOnly === "true") {
      where.isRead = false;
    }

    if (params?.type && params.type !== "ALL") {
      where.type = params.type as NotificationType;
    }

    const [total, unreadCount, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      notifications: notifications.map((n) => this.formatNotification(n)),
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 3. Get Unread Notifications Count for badge
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * 4. Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<NotificationResponse> {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Notification not found or unauthorized access.");
    }

    if (existing.isRead) {
      return this.formatNotification(existing);
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.formatNotification(updated);
  }

  /**
   * 5. Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  /**
   * 6. Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<{ success: boolean }> {
    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error("Notification not found or unauthorized access.");
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  /**
   * 7. Clear all notifications for a user
   */
  async clearAllNotifications(userId: string): Promise<{ deletedCount: number }> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });

    return { deletedCount: result.count };
  }

  /**
   * =========================================================================
   * Automatic Order Lifecycle & Low-Stock Event Dispatches
   * =========================================================================
   */

  /**
   * Event: Order Placed
   * Sends In-App Notification + SMTP Email to customer, and alerts Super Admins and Vendors
   */
  async notifyOrderPlaced(order: any): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const customerTitle = `Order Placed: #${order.orderNumber}`;
      const customerMessage = `Your order for ₹${order.grandTotal.toLocaleString()} has been placed successfully. Payment: ${order.paymentMethod}.`;

      // 1. Create in-app notification for customer
      await this.createNotification(user.id, customerTitle, customerMessage, NotificationType.ORDER_PLACED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        link: `/orders/${order.id}`,
      });

      // 2. Send email to customer in background
      emailService.sendOrderPlacedEmail(order, user).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order placed (${order.orderNumber}):`, err);
      });

      // 3. Notify all Super Admins in real-time
      const admins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.createNotification(
          admin.id,
          `New Order Received: #${order.orderNumber}`,
          `Order #${order.orderNumber} placed by ${user.name || user.email} for ₹${order.grandTotal.toLocaleString()} (${order.items?.length || 0} items).`,
          NotificationType.ORDER_PLACED,
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            grandTotal: order.grandTotal,
            customerName: user.name,
            link: `/admin/orders`,
          }
        ).catch((e) => console.warn(`[NotificationService] Admin notification failed:`, e));
      }

      // 4. Notify Vendors whose products are in this order
      const items = order.items || [];
      const productIds = items.map((i: any) => i.productId).filter(Boolean);
      if (productIds.length > 0) {
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, vendorId: true },
        });
        const vendorIds = Array.from(new Set(products.map((p) => p.vendorId).filter(Boolean) as string[]));
        for (const vendorId of vendorIds) {
          await this.createNotification(
            vendorId,
            `New Customer Order: #${order.orderNumber}`,
            `A customer purchased items from your catalog in order #${order.orderNumber}.`,
            NotificationType.ORDER_PLACED,
            {
              orderId: order.id,
              orderNumber: order.orderNumber,
              link: `/vendor/orders`,
            }
          ).catch((e) => console.warn(`[NotificationService] Vendor notification failed:`, e));
        }
      }
    } catch (err) {
      console.error("[NotificationService] notifyOrderPlaced error:", err);
    }
  }

  /**
   * Event: Order Confirmed (Payment Completed or Status moved to PROCESSING)
   */
  async notifyOrderConfirmed(order: any): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const title = `Order Confirmed: #${order.orderNumber}`;
      const message = `Payment received. Your order #${order.orderNumber} is confirmed and is now being processed.`;

      // Create in-app notification
      await this.createNotification(user.id, title, message, NotificationType.ORDER_CONFIRMED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        paymentStatus: order.paymentStatus,
        link: `/orders/${order.id}`,
      });

      // Send email in background
      emailService.sendOrderConfirmedEmail(order, user).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order confirmed (${order.orderNumber}):`, err);
      });
    } catch (err) {
      console.error("[NotificationService] notifyOrderConfirmed error:", err);
    }
  }

  /**
   * Event: Order Shipped
   */
  async notifyOrderShipped(order: any): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const title = `Order Shipped: #${order.orderNumber}`;
      const message = `Your order #${order.orderNumber} is on the way! It has been dispatched to your delivery address.`;

      // Create in-app notification
      await this.createNotification(user.id, title, message, NotificationType.ORDER_SHIPPED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        link: `/orders/${order.id}`,
      });

      // Send email in background
      emailService.sendOrderShippedEmail(order, user).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order shipped (${order.orderNumber}):`, err);
      });
    } catch (err) {
      console.error("[NotificationService] notifyOrderShipped error:", err);
    }
  }

  /**
   * Event: Order Delivered
   */
  async notifyOrderDelivered(order: any): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const title = `Order Delivered: #${order.orderNumber}`;
      const message = `Package delivered! Your order #${order.orderNumber} has arrived. Enjoy your purchase! (7-day return guarantee active).`;

      // Create in-app notification
      await this.createNotification(user.id, title, message, NotificationType.ORDER_DELIVERED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        deliveredAt: order.deliveredAt || new Date(),
        link: `/orders/${order.id}`,
      });

      // Send email in background
      emailService.sendOrderDeliveredEmail(order, user).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order delivered (${order.orderNumber}):`, err);
      });
    } catch (err) {
      console.error("[NotificationService] notifyOrderDelivered error:", err);
    }
  }

  /**
   * Event: Order Cancelled
   */
  async notifyOrderCancelled(order: any, cancelReason?: string): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const reason = cancelReason || order.cancelReason || "Cancelled upon request";
      const title = `Order Cancelled: #${order.orderNumber}`;
      const message = `Order #${order.orderNumber} has been cancelled. Reason: ${reason}.`;

      // Create in-app notification for customer
      await this.createNotification(user.id, title, message, NotificationType.ORDER_CANCELLED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        cancelReason: reason,
        link: `/orders/${order.id}`,
      });

      // Send email in background
      emailService.sendOrderCancelledEmail(order, user, reason).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order cancelled (${order.orderNumber}):`, err);
      });

      // Alert Super Admins about cancellation
      const admins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      for (const admin of admins) {
        if (admin.id !== user.id) {
          await this.createNotification(
            admin.id,
            `Order Cancelled: #${order.orderNumber}`,
            `Order #${order.orderNumber} was cancelled. Reason: ${reason}`,
            NotificationType.ORDER_CANCELLED,
            {
              orderId: order.id,
              orderNumber: order.orderNumber,
              link: `/admin/orders`,
            }
          ).catch((e) => console.warn(`[NotificationService] Admin cancellation alert failed:`, e));
        }
      }
    } catch (err) {
      console.error("[NotificationService] notifyOrderCancelled error:", err);
    }
  }

  /**
   * Event: Return Requested
   */
  async notifyReturnRequested(returnRequest: any, order: any): Promise<void> {
    try {
      const orderNumber = order?.orderNumber || "ORD";
      const customer = returnRequest.user || (await prisma.user.findUnique({ where: { id: returnRequest.userId } }));

      // 1. Notify Customer
      if (customer) {
        await this.createNotification(
          customer.id,
          `Return Requested: #${orderNumber}`,
          `Your return request for order #${orderNumber} has been received. Reason: ${returnRequest.reason}.`,
          NotificationType.SYSTEM_ALERT,
          {
            orderId: returnRequest.orderId,
            returnId: returnRequest.id,
            link: `/orders/${returnRequest.orderId}`,
          }
        ).catch((e) => console.warn("[NotificationService] Customer return notification failed:", e));
      }

      // 2. Notify Super Admins
      const admins = await prisma.user.findMany({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      for (const admin of admins) {
        await this.createNotification(
          admin.id,
          `Return Request Submitted: #${orderNumber}`,
          `Customer ${customer?.name || "Shopper"} requested a return for order #${orderNumber}. Reason: ${returnRequest.reason}.`,
          NotificationType.SYSTEM_ALERT,
          {
            orderId: returnRequest.orderId,
            returnId: returnRequest.id,
            link: `/admin/orders`,
          }
        ).catch((e) => console.warn("[NotificationService] Admin return notification failed:", e));
      }
    } catch (err) {
      console.error("[NotificationService] notifyReturnRequested error:", err);
    }
  }

  /**
   * Event: Order Refunded
   */
  async notifyOrderRefunded(order: any, returnRequest?: any): Promise<void> {
    try {
      const user = order.user || (await prisma.user.findUnique({ where: { id: order.userId } }));
      if (!user) return;

      const refundAmount = returnRequest?.refundAmount || order.grandTotal;
      const title = `Refund Processed: #${order.orderNumber}`;
      const message = `A refund of ₹${refundAmount.toLocaleString()} has been processed for order #${order.orderNumber}.`;

      // Create in-app notification
      await this.createNotification(user.id, title, message, NotificationType.ORDER_REFUNDED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        refundAmount,
        link: `/orders/${order.id}`,
      });

      // Send email in background
      emailService.sendOrderRefundedEmail(order, user, refundAmount).catch((err) => {
        console.warn(`[NotificationService] Email delivery failed for order refund (${order.orderNumber}):`, err);
      });
    } catch (err) {
      console.error("[NotificationService] notifyOrderRefunded error:", err);
    }
  }

  /**
   * Event: Low Stock Alert for Vendor
   * Checks inventory thresholds, ensures deduplication (24h cooldown per product), and sends in-app notification + email
   */
  async checkAndNotifyLowStock(productId: string, variantId?: string | null): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          vendor: true,
          variants: true,
        },
      });

      if (!product) return;

      let currentStock = product.stock;
      let threshold = product.lowStockThreshold ?? 5;
      let variantObj: any = null;
      let sku = product.sku;

      if (variantId) {
        variantObj = product.variants.find((v) => v.id === variantId);
        if (variantObj) {
          currentStock = variantObj.stock;
          threshold = variantObj.lowStockThreshold ?? product.lowStockThreshold ?? 5;
          sku = variantObj.sku || product.sku;
        }
      }

      // Check if stock has reached or fallen below threshold
      if (currentStock > threshold) {
        return; // Stock is healthy
      }

      // Determine recipient: Vendor if assigned, otherwise notify Admins
      const recipientIds: string[] = [];
      let vendorRecipient = product.vendor;

      if (product.vendorId && product.vendor) {
        recipientIds.push(product.vendorId);
      } else {
        // Find Super Admins if platform product has no vendor
        const admins = await prisma.user.findMany({
          where: { role: "SUPER_ADMIN" },
          select: { id: true, email: true, name: true },
        });
        admins.forEach((a) => recipientIds.push(a.id));
        if (admins.length > 0 && !vendorRecipient) {
          vendorRecipient = {
            ...admins[0],
            businessName: "Platform Store Admin",
          } as any;
        }
      }

      if (recipientIds.length === 0) return;

      // Deduplication check: Check if an unread LOW_STOCK notification was already sent for this product in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lowStockTypes = [
        (NotificationType as any).LOW_STOCK,
        NotificationType.LOW_STOCK_ALERT,
        (NotificationType as any).OUT_OF_STOCK_ALERT,
      ].filter(Boolean) as NotificationType[];

      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: { in: recipientIds },
          type: { in: lowStockTypes },
          createdAt: { gte: oneDayAgo },
        },
      });

      // Filter by productId in data JSON
      if (existingNotification) {
        const notifData = existingNotification.data as any;
        if (notifData && notifData.productId === productId && (!variantId || notifData.variantId === variantId)) {
          // Already notified recently, skip duplicate notification
          return;
        }
      }

      const isOutOfStock = currentStock <= 0;
      const statusTitle = isOutOfStock ? "Out of Stock Alert 🚨" : "Low Stock Alert ⚠️";
      const variantDesc = variantObj?.attributes && Object.keys(variantObj.attributes).length > 0
        ? ` (${Object.entries(variantObj.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")})`
        : "";

      const title = `${statusTitle}: ${product.name}${variantDesc}`;
      const message = isOutOfStock
        ? `Product "${product.name}${variantDesc}" is completely OUT OF STOCK (0 units). Please restock immediately.`
        : `Product "${product.name}${variantDesc}" has only ${currentStock} unit${currentStock === 1 ? "" : "s"} left in stock (Threshold: ${threshold}).`;

      const notificationTypeToUse = ((NotificationType as any).LOW_STOCK || NotificationType.LOW_STOCK_ALERT) as NotificationType;

      // Create in-app notification for all recipients (vendor or admins)
      for (const uid of recipientIds) {
        await this.createNotification(uid, title, message, notificationTypeToUse, {
          productId: product.id,
          variantId: variantId || null,
          productName: product.name,
          currentStock,
          threshold,
          sku,
          link: `/vendor/products`,
        });
      }

      // Send email to vendor in background
      if (vendorRecipient && vendorRecipient.email) {
        emailService
          .sendLowStockAlertEmail(
            vendorRecipient,
            product,
            currentStock,
            threshold,
            sku,
            variantObj?.attributes
          )
          .catch((err) => {
            console.warn(`[NotificationService] Email delivery failed for low stock alert (${product.name}):`, err);
          });
      }
    } catch (err) {
      console.error("[NotificationService] checkAndNotifyLowStock error:", err);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
