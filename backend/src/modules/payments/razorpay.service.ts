import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../../config/env";
import { CreateRazorpayOrderParams, RazorpayOrderResult } from "./payment.types";

export class RazorpayService {
  private razorpayClient: Razorpay | null = null;

  constructor() {
    this.initClient();
  }

  private initClient(): Razorpay {
    if (!this.razorpayClient) {
      this.razorpayClient = new Razorpay({
        key_id: env.razorpayKeyId,
        key_secret: env.razorpayKeySecret,
      });
    }
    return this.razorpayClient;
  }

  /**
   * 1. Create a Razorpay Order
   * Amount is passed in INR and multiplied by 100 to get paise (sub-units)
   */
  async createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrderResult> {
    const client = this.initClient();
    const amountInPaise = Math.round(params.amount * 100);

    if (amountInPaise <= 0) {
      throw new Error("Order amount must be greater than zero for online payment.");
    }

    try {
      const razorpayOrder = await client.orders.create({
        amount: amountInPaise,
        currency: params.currency || "INR",
        receipt: params.receipt.substring(0, 40), // Razorpay receipt max 40 chars
        notes: params.notes || {},
      });

      return {
        id: razorpayOrder.id,
        amount: Number(razorpayOrder.amount),
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt || params.receipt,
        status: razorpayOrder.status,
        notes: (razorpayOrder.notes as Record<string, string>) || {},
        createdAt: Number(razorpayOrder.created_at),
      };
    } catch (error: any) {
      console.error("Razorpay order creation failed:", error);
      throw new Error(
        error?.error?.description ||
          error?.message ||
          "Failed to initiate payment with Razorpay gateway."
      );
    }
  }

  /**
   * 2. Cryptographically verify Razorpay Payment Signature
   * Formula: hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, secret)
   * Supports both object DTO and positional argument overloads
   */
  verifyPaymentSignature(
    orderIdOrDto:
      | string
      | { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
    paymentId?: string,
    signature?: string
  ): boolean {
    let orderId = "";
    let pId = "";
    let sig = "";

    if (typeof orderIdOrDto === "object" && orderIdOrDto !== null) {
      orderId = orderIdOrDto.razorpay_order_id;
      pId = orderIdOrDto.razorpay_payment_id;
      sig = orderIdOrDto.razorpay_signature;
    } else {
      orderId = orderIdOrDto;
      pId = paymentId || "";
      sig = signature || "";
    }

    if (!orderId || !pId || !sig) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", env.razorpayKeySecret)
        .update(`${orderId}|${pId}`)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature, "utf8");
      const signatureBuffer = Buffer.from(sig, "utf8");

      if (generatedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
    } catch (error) {
      console.error("Error during signature verification:", error);
      return false;
    }
  }

  /**
   * 3. Verify Razorpay Webhook Signature
   */
  verifyWebhookSignature(rawBody: string, signature: string, secret?: string): boolean {
    const webhookSecret = secret || env.razorpayWebhookSecret;
    if (!webhookSecret || !signature || !rawBody) {
      return false;
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const generatedBuffer = Buffer.from(generatedSignature, "utf8");
      const signatureBuffer = Buffer.from(signature, "utf8");

      if (generatedBuffer.length !== signatureBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
    } catch (error) {
      console.error("Error during webhook signature verification:", error);
      return false;
    }
  }

  /**
   * 4. Fetch payment details from Razorpay API
   */
  async fetchPayment(paymentId: string): Promise<any> {
    const client = this.initClient();
    try {
      return await client.payments.fetch(paymentId);
    } catch (error: any) {
      console.error(`Failed to fetch Razorpay payment ${paymentId}:`, error);
      throw new Error(error?.error?.description || "Failed to fetch payment details from Razorpay.");
    }
  }
}

export const razorpayService = new RazorpayService();
export default razorpayService;
