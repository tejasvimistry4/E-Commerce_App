import nodemailer, { Transporter } from "nodemailer";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import {
  renderOrderPlacedEmail,
  renderOrderConfirmedEmail,
  renderOrderShippedEmail,
  renderOrderDeliveredEmail,
  renderOrderCancelledEmail,
  renderOrderRefundedEmail,
  renderVendorLowStockAlertEmail,
} from "../templates/emailTemplates";

export class EmailService {
  private transporter: Transporter | null = null;
  private isVerified: boolean = false;

  constructor() {
    this.initTransporter();
  }

  /**
   * Initialize SMTP Mail Server Transporter
   */
  private initTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    try {
      if (env.smtpHost && (env.smtpUser || env.smtpPass)) {
        this.transporter = nodemailer.createTransport({
          host: env.smtpHost,
          port: env.smtpPort,
          secure: env.smtpSecure, // true for 465, false for other ports like 587
          auth: {
            user: env.smtpUser,
            pass: env.smtpPass,
          },
          tls: {
            rejectUnauthorized: false,
          },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
        });

        // Verify connection configuration
        this.transporter.verify((error) => {
          if (error) {
            console.warn(`[EmailService] ⚠️ SMTP connection verification failed (${env.smtpHost}:${env.smtpPort}):`, error.message);
          } else {
            this.isVerified = true;
            console.log(`[EmailService] ✅ SMTP Mail Server ready and connected (${env.smtpHost}:${env.smtpPort})`);
          }
        });

        return this.transporter;
      } else {
        console.warn(`[EmailService] ⚠️ SMTP credentials not set. Please configure SMTP_USER and SMTP_PASS in .env to dispatch live emails to YOPmail and recipient inboxes.`);
        return null;
      }
    } catch (err: any) {
      console.warn("[EmailService] Transporter initialization error:", err?.message || err);
      return null;
    }
  }

  /**
   * Helper: Resolve and attach local image files as inline MIME attachments (CID)
   * or normalize remote URLs for bulletproof rendering in all mail clients (including YOPmail / Gmail).
   */
  private processEmailImage(
    imagePathOrUrl: string | null | undefined,
    cidPrefix: string = "img"
  ): { imageUrl: string | null; attachment?: { filename: string; path: string; cid: string } } {
    if (!imagePathOrUrl || typeof imagePathOrUrl !== "string") {
      return { imageUrl: null };
    }

    const trimmed = imagePathOrUrl.trim();
    if (!trimmed) {
      return { imageUrl: null };
    }

    // If already a CID or Data URI
    if (trimmed.startsWith("cid:") || trimmed.startsWith("data:")) {
      return { imageUrl: trimmed };
    }

    // If remote HTTP/HTTPS URL (not pointing to local machine)
    if (
      (trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
      !trimmed.includes("localhost") &&
      !trimmed.includes("127.0.0.1")
    ) {
      return { imageUrl: trimmed };
    }

    // Extract filename from relative path or localhost URL
    // Examples:
    // "/uploads/product-123.jpg" -> "product-123.jpg"
    // "uploads/product-123.jpg" -> "product-123.jpg"
    // "http://localhost:5000/uploads/product-123.jpg" -> "product-123.jpg"
    let cleanFilename = trimmed;
    if (cleanFilename.includes("/uploads/")) {
      cleanFilename = cleanFilename.substring(cleanFilename.indexOf("/uploads/") + "/uploads/".length);
    } else if (cleanFilename.includes("\\uploads\\")) {
      cleanFilename = cleanFilename.substring(cleanFilename.indexOf("\\uploads\\") + "\\uploads\\".length);
    } else if (cleanFilename.startsWith("uploads/")) {
      cleanFilename = cleanFilename.replace(/^uploads\//, "");
    } else if (cleanFilename.startsWith("/")) {
      cleanFilename = cleanFilename.replace(/^\/+/, "");
    }

    // Remove query params if any
    cleanFilename = cleanFilename.split("?")[0];

    // Check potential locations on local filesystem
    const possiblePaths = [
      path.resolve(process.cwd(), "uploads", cleanFilename),
      path.resolve(process.cwd(), "backend", "uploads", cleanFilename),
      path.resolve(process.cwd(), cleanFilename),
    ];

    for (const filePath of possiblePaths) {
      try {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const uniqueId = `${cidPrefix}_${Math.random().toString(36).substring(2, 9)}`;
          const cid = `${uniqueId}@ecommerce.local`;
          return {
            imageUrl: `cid:${cid}`,
            attachment: {
              filename: path.basename(filePath),
              path: filePath,
              cid,
            },
          };
        }
      } catch {
        // Continue fallback search
      }
    }

    // If local file not found on disk, fallback to fully qualified backend URL
    const fallbackUrl = trimmed.startsWith("http")
      ? trimmed
      : `${env.backendUrl}/${trimmed.replace(/^[\\/]+/, "")}`;

    return { imageUrl: fallbackUrl };
  }

  /**
   * Helper: Process order items array and build inline CID attachments
   */
  private prepareOrderItemsWithAttachments(items: any[]): {
    processedItems: Array<{
      name: string;
      image: string | null;
      quantity: number;
      price: number;
      totalPrice: number;
      variantAttributes?: Record<string, any> | null;
    }>;
    attachments: Array<{ filename: string; path: string; cid: string }>;
  } {
    const attachments: Array<{ filename: string; path: string; cid: string }> = [];
    const processedItems = (items || []).map((item, index) => {
      const { imageUrl, attachment } = this.processEmailImage(item.image, `item_${index}`);
      if (attachment) {
        attachments.push(attachment);
      }
      return {
        name: item.name,
        image: imageUrl,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
        variantAttributes: item.variantAttributes,
      };
    });

    return { processedItems, attachments };
  }

  /**
   * Safe email sender using SMTP transport with error catching & inline MIME attachments
   */
  private async sendMail(
    to: string,
    subject: string,
    html: string,
    attachments: Array<{ filename: string; path: string; cid?: string }> = []
  ): Promise<boolean> {
    try {
      const transporter = this.transporter || this.initTransporter();

      if (!to || !to.includes("@")) {
        console.warn(`[EmailService] Skipping email dispatch: Invalid destination email "${to}"`);
        return false;
      }

      if (transporter && env.smtpUser && env.smtpPass) {
        const mailOptions: any = {
          from: env.smtpFrom,
          to,
          subject,
          html,
        };

        if (attachments && attachments.length > 0) {
          mailOptions.attachments = attachments;
        }

        const info = await transporter.sendMail(mailOptions);

        console.log(`[EmailService] ✉️  SMTP Email delivered to ${to}: "${subject}" (MessageId: ${info.messageId}, Attachments: ${attachments.length})`);
        return true;
      } else {
        // Log notification when SMTP credentials are not yet populated in .env
        console.log(`[EmailService:Notice] ✉️  [To: ${to}] [Subject: ${subject}] - To receive this email in YOPmail, configure SMTP_HOST/USER/PASS in .env`);
        return true;
      }
    } catch (error: any) {
      console.error(`[EmailService:Error] SMTP failed to deliver email to ${to} ("${subject}"):`, error?.message || error);
      // Non-blocking guarantee: Never throw error to protect calling order or inventory transactions!
      return false;
    }
  }

  /**
   * 1. Send Order Placed Email
   */
  async sendOrderPlacedEmail(order: any, user: { name: string; email: string }): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderPlacedEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order placed email:", err);
      return false;
    }
  }

  /**
   * 2. Send Order Confirmed / Processing Email
   */
  async sendOrderConfirmedEmail(order: any, user: { name: string; email: string }): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderConfirmedEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order confirmed email:", err);
      return false;
    }
  }

  /**
   * 3. Send Order Shipped Email
   */
  async sendOrderShippedEmail(order: any, user: { name: string; email: string }): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderShippedEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order shipped email:", err);
      return false;
    }
  }

  /**
   * 4. Send Order Delivered Email
   */
  async sendOrderDeliveredEmail(order: any, user: { name: string; email: string }): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderDeliveredEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        notes: order.notes,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order delivered email:", err);
      return false;
    }
  }

  /**
   * 5. Send Order Cancelled Email
   */
  async sendOrderCancelledEmail(
    order: any,
    user: { name: string; email: string },
    cancelReason?: string
  ): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderCancelledEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        cancelReason: cancelReason || order.cancelReason,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order cancelled email:", err);
      return false;
    }
  }

  /**
   * 6. Send Order Refunded Email
   */
  async sendOrderRefundedEmail(
    order: any,
    user: { name: string; email: string },
    refundAmount?: number
  ): Promise<boolean> {
    try {
      const { processedItems, attachments } = this.prepareOrderItemsWithAttachments(order.items);

      const { subject, html } = renderOrderRefundedEmail({
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: user.name || "Valued Customer",
        customerEmail: user.email,
        createdAt: order.createdAt,
        items: processedItems,
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        refundAmount: refundAmount || order.grandTotal,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(user.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering order refunded email:", err);
      return false;
    }
  }

  /**
   * 7. Send Vendor Low-Stock Alert Email
   */
  async sendLowStockAlertEmail(
    vendor: { name: string; email: string; businessName?: string | null },
    product: { id: string; name: string; thumbnail?: string | null; images?: string[] },
    currentStock: number,
    threshold: number,
    sku?: string | null,
    variantAttributes?: Record<string, any> | null
  ): Promise<boolean> {
    try {
      const rawImage = product.thumbnail || product.images?.[0] || null;
      const { imageUrl, attachment } = this.processEmailImage(rawImage, `stock_${product.id.substring(0, 8)}`);
      const attachments = attachment ? [attachment] : [];

      const { subject, html } = renderVendorLowStockAlertEmail({
        vendorName: vendor.businessName || vendor.name || "Merchant Partner",
        vendorEmail: vendor.email,
        productName: product.name,
        productId: product.id,
        variantAttributes,
        sku,
        currentStock,
        threshold,
        productImage: imageUrl,
        frontendUrl: env.frontendUrl,
        backendUrl: env.backendUrl,
      });

      return this.sendMail(vendor.email, subject, html, attachments);
    } catch (err) {
      console.error("[EmailService] Error rendering low-stock alert email:", err);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;

