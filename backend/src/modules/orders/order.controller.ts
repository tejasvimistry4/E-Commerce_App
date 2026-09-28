import { Response } from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import orderService from "./order.service";

export class OrderController {
  /**
   * 1. Create order
   */
  static async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.createOrder(userId, req.body);

      res.status(201).json({
        success: true,
        message: result.razorpay
          ? "Order initiated! Please complete online payment."
          : "Order placed successfully! We've received your order.",
        data: result.order,
        razorpay: result.razorpay,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to place order.",
      });
    }
  }

  /**
   * 2. Get customer's orders history
   */
  static async getMyOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.getMyOrders(userId, req.query);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve order history.",
      });
    }
  }

  /**
   * 3. Get single order by ID for customer
   */
  static async getMyOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const order = await orderService.getMyOrderById(userId, req.params.id as string);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Order not found.",
      });
    }
  }

  /**
   * 4. Cancel order by customer
   */
  static async cancelMyOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const order = await orderService.cancelMyOrder(
        userId,
        req.params.id as string,
        req.body.reason
      );

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully. Product stock has been restored.",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel order.",
      });
    }
  }

  /**
   * 5. Get saved addresses for checkout
   */
  static async getUserAddresses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const addresses = await orderService.getUserAddresses(userId);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch addresses.",
      });
    }
  }

  /**
   * 6. Admin: Get all orders (Admin / Vendor)
   */
  static async getAllOrdersAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const result = await orderService.getAllOrdersAdmin(req.query, caller);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch orders for admin.",
      });
    }
  }

  /**
   * 7. Admin: Get single order details
   */
  static async getOrderByIdAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const order = await orderService.getOrderByIdAdmin(req.params.id as string, caller);

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Order not found.",
      });
    }
  }

  /**
   * 8. Admin: Update order status
   */
  static async updateOrderStatusAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const order = await orderService.updateOrderStatusAdmin(
        req.params.id as string,
        req.body
      );

      res.status(200).json({
        success: true,
        message: `Order status updated to ${order.status}.`,
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update order status.",
      });
    }
  }

  /**
   * 9. Admin: Get order metrics & revenue stats
   */
  static async getOrderStatsAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const stats = await orderService.getOrderStatsAdmin(caller);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch order statistics.",
      });
    }
  }

  /**
   * 10. Customer: Request product return
   */
  static async requestOrderReturn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.requestOrderReturn(
        userId,
        req.params.id as string,
        req.body
      );

      res.status(201).json({
        success: true,
        message: "Return request submitted successfully. Our team will review your request shortly.",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit return request.",
      });
    }
  }

  /**
   * 11. Customer: Get customer's return requests
   */
  static async getMyReturns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.getMyReturns(userId, req.query);

      res.status(200).json({
        success: true,
        data: result.returns,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to retrieve return requests.",
      });
    }
  }

  /**
   * 12. Customer: Get return details for single order
   */
  static async getMyOrderReturn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.getMyOrderReturn(userId, req.params.id as string);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Return request not found.",
      });
    }
  }

  /**
   * 13. Admin: Get all returns
   */
  static async getAllReturnsAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await orderService.getAllReturnsAdmin(req.query);

      res.status(200).json({
        success: true,
        data: result.returns,
        pagination: result.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch return requests.",
      });
    }
  }

  /**
   * 14. Admin: Get return by ID
   */
  static async getReturnByIdAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await orderService.getReturnByIdAdmin(req.params.id as string);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Return request not found.",
      });
    }
  }

  /**
   * 15. Admin: Update return status
   */
  static async updateReturnStatusAdmin(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await orderService.updateReturnStatusAdmin(
        req.params.id as string,
        req.body
      );

      res.status(200).json({
        success: true,
        message: `Return request status updated to ${result.status}.`,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update return status.",
      });
    }
  }

  /**
   * 16. Verify Razorpay Payment Signature
   */
  static async verifyPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const order = await orderService.verifyPayment(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Payment verified successfully! Your order is being processed.",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Payment verification failed.",
      });
    }
  }

  /**
   * 17. Report Payment Failure
   */
  static async handlePaymentFailed(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const order = await orderService.handlePaymentFailed(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Payment failure recorded.",
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to record payment status.",
      });
    }
  }

  /**
   * 18. Retry Payment for Pending / Failed Order
   */
  static async retryPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const result = await orderService.retryPayment(userId, req.params.id as string);

      res.status(200).json({
        success: true,
        message: "Payment retry initiated.",
        data: result.order,
        razorpay: result.razorpay,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to initiate payment retry.",
      });
    }
  }

  /**
   * 19. Handle Razorpay Webhooks
   */
  static async handleWebhook(req: any, res: Response): Promise<void> {
    try {
      const signature = (req.headers["x-razorpay-signature"] as string) || "";
      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const result = await orderService.handleWebhook(rawBody, signature, req.body);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      console.error("Razorpay webhook error:", error.message);
      res.status(400).json({
        success: false,
        message: error.message || "Webhook processing failed.",
      });
    }
  }

  /**
   * 20. Customer: Download Order PDF (Receipt / Packing Slip)
   */
  static async downloadMyOrderPdf(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id as string;
      const isDownload = req.query.download === "true" || req.query.download === "1";
      const docType = (req.query.type as string) === "invoice" ? "invoice" : "order";

      const doc = await orderService.generateOrderDocument(orderId, userId, undefined, docType);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${isDownload ? "attachment" : "inline"}; filename="${doc.filename}"`
      );
      res.setHeader("Content-Length", doc.buffer.length);
      res.end(doc.buffer);
    } catch (error: any) {
      res.status(error.message?.includes("Forbidden") ? 403 : 404).json({
        success: false,
        message: error.message || "Failed to generate Order PDF.",
      });
    }
  }

  /**
   * 21. Customer: Download Tax Invoice PDF
   */
  static async downloadMyOrderInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const orderId = req.params.id as string;
      const isDownload = req.query.download !== "false";

      const doc = await orderService.generateOrderDocument(orderId, userId, undefined, "invoice");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${isDownload ? "attachment" : "inline"}; filename="${doc.filename}"`
      );
      res.setHeader("Content-Length", doc.buffer.length);
      res.end(doc.buffer);
    } catch (error: any) {
      res.status(error.message?.includes("Forbidden") ? 403 : 404).json({
        success: false,
        message: error.message || "Failed to generate Tax Invoice PDF.",
      });
    }
  }

  /**
   * 22. Admin / Vendor: Download Order PDF
   */
  static async downloadAdminOrderPdf(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const orderId = req.params.id as string;
      const isDownload = req.query.download === "true" || req.query.download === "1";
      const docType = (req.query.type as string) === "invoice" ? "invoice" : "order";

      const doc = await orderService.generateOrderDocument(orderId, undefined, caller, docType);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${isDownload ? "attachment" : "inline"}; filename="${doc.filename}"`
      );
      res.setHeader("Content-Length", doc.buffer.length);
      res.end(doc.buffer);
    } catch (error: any) {
      res.status(error.message?.includes("Forbidden") ? 403 : 404).json({
        success: false,
        message: error.message || "Failed to generate Admin Order PDF.",
      });
    }
  }

  /**
   * 23. Admin / Vendor: Download Tax Invoice PDF
   */
  static async downloadAdminOrderInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const caller = req.user ? { id: req.user.id, role: req.user.role } : undefined;
      const orderId = req.params.id as string;
      const isDownload = req.query.download !== "false";

      const doc = await orderService.generateOrderDocument(orderId, undefined, caller, "invoice");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `${isDownload ? "attachment" : "inline"}; filename="${doc.filename}"`
      );
      res.setHeader("Content-Length", doc.buffer.length);
      res.end(doc.buffer);
    } catch (error: any) {
      res.status(error.message?.includes("Forbidden") ? 403 : 404).json({
        success: false,
        message: error.message || "Failed to generate Admin Invoice PDF.",
      });
    }
  }
}

export default OrderController;



