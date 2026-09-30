import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { paymentService } from "./payment.service";
import { VerifyPaymentDto, PaymentFailedDto } from "./payment.types";

export class PaymentController {
  /**
   * 1. Verify Razorpay Payment Signature
   * POST /api/payments/verify (or /api/orders/verify-payment)
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const dto: VerifyPaymentDto = {
        orderId: req.body.orderId,
        razorpay_order_id: req.body.razorpay_order_id,
        razorpay_payment_id: req.body.razorpay_payment_id,
        razorpay_signature: req.body.razorpay_signature,
      };

      const order = await paymentService.verifyPayment(userId, dto);

      res.status(200).json({
        success: true,
        message: "Payment verified successfully. Your order is now being processed.",
        data: order,
      });
    } catch (error: any) {
      if (error.message?.includes("Signature mismatch") || error.message?.includes("Untrusted")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
      next(error);
    }
  }

  /**
   * 2. Handle Payment Failure
   * POST /api/payments/failed (or /api/orders/payment-failed)
   */
  async paymentFailed(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const dto: PaymentFailedDto = {
        orderId: req.body.orderId,
        errorReason: req.body.errorReason,
        errorCode: req.body.errorCode,
        paymentId: req.body.paymentId,
      };

      const order = await paymentService.handlePaymentFailed(userId, dto);

      res.status(200).json({
        success: true,
        message: "Payment failure recorded. You can retry payment anytime.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Retry Payment
   * POST /api/payments/retry/:id (or /api/orders/my-orders/:id/retry-payment)
   */
  async retryPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
      }

      const orderId = (req.params.id as string) || (req.params.orderId as string);
      if (!orderId) {
        res.status(400).json({ success: false, message: "Order ID parameter is required." });
        return;
      }

      const result = await paymentService.retryPayment(userId, orderId);


      res.status(200).json({
        success: true,
        message: "Payment retry initiated. Complete checkout in Razorpay modal.",
        data: result.order,
        razorpay: result.razorpay,
      });
    } catch (error: any) {
      if (error.message?.includes("already been paid") || error.message?.includes("Cancelled")) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * 4. Razorpay Webhook Endpoint
   * POST /api/payments/webhook (or /api/orders/webhook)
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawSig = req.headers["x-razorpay-signature"];
      const signature = Array.isArray(rawSig) ? rawSig[0] : (rawSig as string) || "";
      if (!signature) {
        res.status(400).json({ success: false, message: "Missing Razorpay webhook signature header." });
        return;
      }

      const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const result = await paymentService.handleWebhook(rawBody, signature, req.body);

      res.status(200).json(result);

    } catch (error: any) {
      console.error("Razorpay webhook error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to process webhook.",
      });
    }
  }
}

export const paymentController = new PaymentController();
export default paymentController;
