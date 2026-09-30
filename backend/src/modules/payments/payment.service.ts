import { PrismaClient, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { razorpayService } from "./razorpay.service";
import {
  VerifyPaymentDto,
  PaymentFailedDto,
  CreateOrderResult,
  RazorpayCheckoutData,
} from "./payment.types";
import { OrderResponse } from "../orders/order.types";
import { env } from "../../config/env";
import { notificationService } from "../notifications/notification.service";

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Helper: Format order for clean API response
   */
  private formatOrder(order: any): OrderResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.couponCode,
      shippingFee: order.shippingFee,
      tax: order.tax,
      grandTotal: order.grandTotal,
      shippingAddress: order.shippingAddress as any,
      billingAddress: order.billingAddress as any,
      notes: order.notes,
      razorpayOrderId: order.razorpayOrderId || null,
      razorpayPaymentId: order.razorpayPaymentId || null,
      razorpaySignature: order.razorpaySignature || null,
      cancelledAt: order.cancelledAt,
      cancelReason: order.cancelReason,
      deliveredAt: order.deliveredAt || null,
      returnUntil: order.returnUntil || null,
      returnRequest: order.returnRequest
        ? {
            id: order.returnRequest.id,
            orderId: order.returnRequest.orderId,
            userId: order.returnRequest.userId,
            reason: order.returnRequest.reason,
            details: order.returnRequest.details,
            status: order.returnRequest.status,
            adminComment: order.returnRequest.adminComment,
            refundAmount: order.returnRequest.refundAmount,
            refundedAt: order.returnRequest.refundedAt,
            pickedUpAt: order.returnRequest.pickedUpAt,
            receivedAt: order.returnRequest.receivedAt,
            createdAt: order.returnRequest.createdAt,
            updatedAt: order.returnRequest.updatedAt,
          }
        : null,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
      user: order.user
        ? {
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
          }
        : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * 1. Verify Razorpay Payment Signature
   * Validates HMAC SHA-256 signature and updates order status to COMPLETED & PROCESSING
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        user: true,
        returnRequest: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found or unauthorized access.");
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      return this.formatOrder(order);
    }

    // Verify cryptographic signature
    const isValid = razorpayService.verifyPaymentSignature(
      dto.razorpay_order_id,
      dto.razorpay_payment_id,
      dto.razorpay_signature
    );

    if (!isValid) {
      await prisma.order.update({
        where: { id: dto.orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          notes: order.notes
            ? `${order.notes} | Invalid signature verification`
            : "Payment verification failed: Signature mismatch",
        },
      });
      throw new Error("Payment signature verification failed. Untrusted payment.");
    }

    // Atomic update to mark order payment as COMPLETED and status as PROCESSING
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const confirmed = await tx.order.update({
        where: { id: dto.orderId },
        data: {
          paymentStatus: PaymentStatus.COMPLETED,
          status: OrderStatus.PROCESSING,
          razorpayOrderId: dto.razorpay_order_id,
          razorpayPaymentId: dto.razorpay_payment_id,
          razorpaySignature: dto.razorpay_signature,
        },
        include: {
          items: true,
          user: true,
          returnRequest: true,
        },
      });

      // Ensure user cart is empty
      const userCart = await tx.cart.findUnique({ where: { userId } });
      if (userCart) {
        await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return confirmed;
    });

    notificationService.notifyOrderConfirmed(updatedOrder).catch((err) => {
      console.warn("[PaymentService] notifyOrderConfirmed failed:", err);
    });

    return this.formatOrder(updatedOrder);
  }

  /**
   * 2. Record Payment Failure
   */
  async handlePaymentFailed(userId: string, dto: PaymentFailedDto): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        user: true,
        returnRequest: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found or unauthorized access.");
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      return this.formatOrder(order);
    }

    const failureReason = [
      dto.errorCode ? `Code: ${dto.errorCode}` : "",
      dto.errorReason ? `Reason: ${dto.errorReason}` : "",
      dto.paymentId ? `PaymentId: ${dto.paymentId}` : "",
    ]
      .filter(Boolean)
      .join(" - ");

    const updatedOrder = await prisma.order.update({
      where: { id: dto.orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        razorpayPaymentId: dto.paymentId || order.razorpayPaymentId,
        notes: failureReason
          ? order.notes
            ? `${order.notes} | ${failureReason}`
            : `Payment Failed: ${failureReason}`
          : order.notes,
      },
      include: {
        items: true,
        user: true,
        returnRequest: true,
      },
    });

    return this.formatOrder(updatedOrder);
  }

  /**
   * 3. Retry Payment for Pending or Failed Order
   */
  async retryPayment(userId: string, orderId: string): Promise<CreateOrderResult> {
    const [user, order] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: true,
          returnRequest: true,
        },
      }),
    ]);

    if (!user || !order || order.userId !== userId) {
      throw new Error("Order not found or unauthorized access.");
    }

    if (order.paymentStatus === PaymentStatus.COMPLETED) {
      throw new Error("This order has already been paid for.");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Cancelled order cannot be paid for.");
    }

    // Generate new Razorpay order
    const razorpayOrder = await razorpayService.createOrder({
      amount: order.grandTotal,
      receipt: order.orderNumber,
      notes: {
        orderId: order.id,
        userId,
        orderNumber: order.orderNumber,
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: PaymentStatus.PENDING,
      },
      include: {
        items: true,
        user: true,
        returnRequest: true,
      },
    });

    const shippingAddress = order.shippingAddress as any;

    return {
      order: this.formatOrder(updatedOrder),
      razorpay: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: env.razorpayKeyId,
        orderNumber: order.orderNumber,
        prefill: {
          name: shippingAddress?.fullName || user.name,
          email: user.email,
          contact: shippingAddress?.phone || "",
        },
      },
    };
  }

  /**
   * 4. Webhook handler for async payment verification from Razorpay
   */
  async handleWebhook(
    rawBody: string,
    signature: string,
    payload: any
  ): Promise<{ success: boolean; message: string }> {
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error("Invalid Razorpay webhook signature.");
    }

    const event = payload?.event;
    const paymentEntity = payload?.payload?.payment?.entity;
    const orderEntity = payload?.payload?.order?.entity;

    const orderId = paymentEntity?.notes?.orderId || orderEntity?.notes?.orderId;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;

    if (!orderId && !razorpayOrderId) {
      return { success: true, message: "No matching order identifier found in webhook payload." };
    }

    const whereClause: Prisma.OrderWhereInput = orderId
      ? { id: orderId }
      : { razorpayOrderId };

    const order = await prisma.order.findFirst({ where: whereClause });
    if (!order) {
      return { success: true, message: "Order not found for webhook event." };
    }

    if (event === "payment.captured" || event === "order.paid") {
      if (order.paymentStatus !== PaymentStatus.COMPLETED) {
        const updated = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.COMPLETED,
            status: order.status === OrderStatus.PENDING ? OrderStatus.PROCESSING : order.status,
            razorpayPaymentId: paymentEntity?.id || order.razorpayPaymentId,
            razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
          },
          include: {
            items: true,
            user: true,
          },
        });

        notificationService.notifyOrderConfirmed(updated).catch((err) => {
          console.warn("[PaymentService] notifyOrderConfirmed from webhook failed:", err);
        });
      }
    } else if (event === "payment.failed") {
      if (order.paymentStatus !== PaymentStatus.COMPLETED) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            razorpayPaymentId: paymentEntity?.id || order.razorpayPaymentId,
            notes: order.notes
              ? `${order.notes} | Webhook payment failed: ${paymentEntity?.error_description || "Failed"}`
              : `Webhook payment failed: ${paymentEntity?.error_description || "Failed"}`,
          },
        });
      }
    }

    return { success: true, message: `Webhook event "${event}" processed successfully.` };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
