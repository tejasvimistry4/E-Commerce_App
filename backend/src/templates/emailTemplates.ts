/**
 * Reusable HTML Email Templates for E-Commerce Notifications
 * Modern, responsive inline CSS designs for all email clients.
 */

interface OrderEmailData {
  orderNumber: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  createdAt: Date | string;
  items: Array<{
    name: string;
    image?: string | null;
    quantity: number;
    price: number;
    totalPrice: number;
    variantAttributes?: Record<string, any> | null;
  }>;
  subtotal: number;
  discount?: number;
  shippingFee?: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  } | null;
  notes?: string | null;
  cancelReason?: string | null;
  refundAmount?: number;
  frontendUrl?: string;
  backendUrl?: string;
}

interface LowStockEmailData {
  vendorName: string;
  vendorEmail: string;
  productName: string;
  productId: string;
  variantAttributes?: Record<string, any> | null;
  sku?: string | null;
  currentStock: number;
  threshold: number;
  productImage?: string | null;
  frontendUrl?: string;
  backendUrl?: string;
}

const formatCurrency = (amount: number): string => {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Safely resolves an image path/URL for email clients.
 * Supports:
 * - CID inline attachments (e.g. "cid:item_0@ecommerce.local")
 * - Data URLs (e.g. "data:image/...")
 * - Absolute remote URLs (e.g. "https://...")
 * - Local / uploads paths (e.g. "/uploads/...", "uploads/...") converted to full backend URLs
 */
export const resolveEmailImageUrl = (
  imageUrl?: string | null,
  backendUrl: string = "http://localhost:5000",
  frontendUrl: string = "http://localhost:3000"
): string | null => {
  if (!imageUrl || typeof imageUrl !== "string") return null;
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  // Already Content-ID or Data URI or Remote HTTP(S) URL
  if (
    trimmed.startsWith("cid:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  // Normalize relative paths (e.g. "/uploads/..." or "uploads/...")
  const cleanPath = trimmed.replace(/^[\\/]+/, "");
  const base = backendUrl ? backendUrl.replace(/\/+$/, "") : "http://localhost:5000";
  return `${base}/${cleanPath}`;
};

/**
 * Robust product thumbnail renderer for email clients with styled fallback cell
 */
export const renderProductThumbnail = (
  imageUrl?: string | null,
  name: string = "Product",
  size: number = 48,
  fallbackEmoji: string = "🛍️",
  backendUrl?: string,
  frontendUrl?: string
): string => {
  const resolvedUrl = resolveEmailImageUrl(imageUrl, backendUrl, frontendUrl);
  const safeAlt = (name || "Product").replace(/"/g, "&quot;");
  const emojiFontSize = Math.max(14, Math.round(size * 0.42));

  if (!resolvedUrl) {
    return `
      <table border="0" cellpadding="0" cellspacing="0" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; border-radius: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: separate; table-layout: fixed;">
        <tr>
          <td align="center" valign="middle" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; text-align: center; vertical-align: middle; font-size: ${emojiFontSize}px; line-height: 1; padding: 0; margin: 0; background-color: #f8fafc; border-radius: 7px;">
            ${fallbackEmoji}
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; border-radius: 8px; overflow: hidden; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-collapse: separate; table-layout: fixed;">
      <tr>
        <td align="center" valign="middle" width="${size}" height="${size}" style="width: ${size}px; height: ${size}px; padding: 0; margin: 0; background-color: #f1f5f9; text-align: center; vertical-align: middle; line-height: 1; border-radius: 7px;">
          <img src="${resolvedUrl}" alt="${safeAlt}" width="${size}" height="${size}" style="display: block; width: ${size}px; height: ${size}px; max-width: ${size}px; max-height: ${size}px; object-fit: cover; border-radius: 7px; border: 0; outline: none; text-decoration: none;" />
        </td>
      </tr>
    </table>
  `;
};

/**
 * Base Email Shell providing consistent container, header, typography & footer
 */
const renderEmailShell = (title: string, badgeText: string, badgeColor: string, bodyContent: string, frontendUrl: string = "http://localhost:3000"): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center" style="padding: 0;">
        <!-- Email Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 32px; text-align: left;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      E-Commerce<span style="color: #a5b4fc;">.</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 9999px; background-color: ${badgeColor}; color: #ffffff;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; font-weight: 500;">
                You are receiving this automated email because of activity associated with your account on E-Commerce Store.
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                <a href="${frontendUrl}" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Visit Marketplace</a> &nbsp;•&nbsp;
                <a href="${frontendUrl}/orders" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Order History</a> &nbsp;•&nbsp;
                <a href="${frontendUrl}/vendor" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Vendor Portal</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

/**
 * Render Order Items Table HTML with bulletproof thumbnails
 */
const renderOrderItemsTable = (
  items: OrderEmailData["items"],
  backendUrl?: string,
  frontendUrl?: string
): string => {
  const rows = items
    .map((item) => {
      const variantStr = item.variantAttributes && Object.keys(item.variantAttributes).length > 0
        ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">${Object.entries(item.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(", ")}</div>`
        : "";

      const imageHtml = renderProductThumbnail(
        item.image,
        item.name,
        48,
        "🛍️",
        backendUrl,
        frontendUrl
      );

      return `
      <tr>
        <td style="padding: 12px 8px 12px 0; vertical-align: top; width: 56px;">
          ${imageHtml}
        </td>
        <td style="padding: 12px 12px 12px 0; vertical-align: top;">
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.3;">${item.name}</div>
          ${variantStr}
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Qty: ${item.quantity} × ${formatCurrency(item.price)}</div>
        </td>
        <td align="right" style="padding: 12px 0; vertical-align: top; font-size: 13px; font-weight: 700; color: #0f172a;">
          ${formatCurrency(item.totalPrice)}
        </td>
      </tr>
      `;
    })
    .join("");

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-top: 16px; margin-bottom: 16px;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0;">
          <th colspan="2" align="left" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Item Description</th>
          <th align="right" style="padding-bottom: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

/**
 * Render Price Breakdown Summary Box
 */
const renderPriceSummary = (data: OrderEmailData): string => {
  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin-top: 16px;">
      <tr>
        <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Subtotal</td>
        <td align="right" style="font-size: 13px; font-weight: 600; color: #1e293b; padding-bottom: 6px;">${formatCurrency(data.subtotal)}</td>
      </tr>
      ${
        data.discount && data.discount > 0
          ? `
      <tr>
        <td style="font-size: 13px; color: #10b981; padding-bottom: 6px;">Discount Applied</td>
        <td align="right" style="font-size: 13px; font-weight: 600; color: #10b981; padding-bottom: 6px;">-${formatCurrency(data.discount)}</td>
      </tr>
      `
          : ""
      }
      <tr>
        <td style="font-size: 13px; color: #64748b; padding-bottom: 10px;">Shipping Fee</td>
        <td align="right" style="font-size: 13px; font-weight: 600; color: #1e293b; padding-bottom: 10px;">${
          data.shippingFee && data.shippingFee > 0 ? formatCurrency(data.shippingFee) : '<span style="color: #10b981;">FREE</span>'
        }</td>
      </tr>
      <tr style="border-top: 1px solid #cbd5e1;">
        <td style="font-size: 15px; font-weight: 800; color: #0f172a; padding-top: 10px;">Grand Total</td>
        <td align="right" style="font-size: 16px; font-weight: 900; color: #4f46e5; padding-top: 10px;">${formatCurrency(data.grandTotal)}</td>
      </tr>
    </table>
  `;
};

/**
 * Render Shipping Address Box
 */
const renderShippingAddress = (addr?: OrderEmailData["shippingAddress"]): string => {
  if (!addr) return "";
  return `
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 16px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">📍 Shipping Address</div>
      <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${addr.fullName || "Valued Customer"}</div>
      <div style="font-size: 12px; color: #475569; margin-top: 2px;">${addr.streetAddress || ""}</div>
      <div style="font-size: 12px; color: #475569;">${[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</div>
      <div style="font-size: 12px; color: #475569;">${addr.country || "India"}</div>
      ${addr.phone ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">Phone: ${addr.phone}</div>` : ""}
    </div>
  `;
};

/**
 * 1. ORDER PLACED EMAIL TEMPLATE
 */
export const renderOrderPlacedEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Order Placed Successfully! 🎉</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, thank you for your purchase. We have received your order <strong>#${data.orderNumber}</strong> and will begin preparing it shortly.
    </p>

    <!-- Quick Info Cards -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; width: 50%;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Order Number</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${data.orderNumber}</div>
        </td>
        <td style="width: 12px;"></td>
        <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; width: 50%;">
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Payment Method</div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">${data.paymentMethod}</div>
        </td>
      </tr>
    </table>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}
    ${renderPriceSummary(data)}
    ${renderShippingAddress(data.shippingAddress)}

    <!-- Action Button -->
    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #4f46e5; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
        View Order Details & Track →
      </a>
    </div>
  `;

  return {
    subject: `Order Confirmation #${data.orderNumber} - E-Commerce Store`,
    html: renderEmailShell("Order Placed", "Order Placed", "#4f46e5", body, frontendUrl),
  };
};

/**
 * 2. ORDER CONFIRMED / PROCESSING EMAIL TEMPLATE
 */
export const renderOrderConfirmedEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Payment Confirmed & Order in Progress! ✅</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, great news! The payment for your order <strong>#${data.orderNumber}</strong> has been verified. Our team and vendor partners are now packaging your items.
    </p>

    <!-- Quick Info Cards -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; width: 50%;">
          <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase;">Payment Status</div>
          <div style="font-size: 13px; font-weight: 800; color: #15803d; margin-top: 2px;">PAID / COMPLETED</div>
        </td>
        <td style="width: 12px;"></td>
        <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 12px 16px; width: 50%;">
          <div style="font-size: 11px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Fulfillment Status</div>
          <div style="font-size: 13px; font-weight: 800; color: #2563eb; margin-top: 2px;">PROCESSING</div>
        </td>
      </tr>
    </table>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}
    ${renderPriceSummary(data)}
    ${renderShippingAddress(data.shippingAddress)}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #10b981; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">
        Track Fulfillment Progress →
      </a>
    </div>
  `;

  return {
    subject: `Order Confirmed #${data.orderNumber} - Processing`,
    html: renderEmailShell("Order Confirmed", "Confirmed", "#10b981", body, frontendUrl),
  };
};

/**
 * 3. ORDER SHIPPED EMAIL TEMPLATE
 */
export const renderOrderShippedEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your Order is On Its Way! 🚚</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, your package for order <strong>#${data.orderNumber}</strong> has been handed over to our delivery partner and is en route to your delivery address.
    </p>

    <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #1e40af;">Status: Shipped & In Transit</div>
      <div style="font-size: 12px; color: #3b82f6; margin-top: 2px;">
        Expected Delivery: Standard courier timeline (2-4 business days).
      </div>
    </div>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}
    ${renderShippingAddress(data.shippingAddress)}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #3b82f6; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3);">
        Track Live Delivery →
      </a>
    </div>
  `;

  return {
    subject: `Your Order #${data.orderNumber} has been Shipped! 📦`,
    html: renderEmailShell("Order Shipped", "Shipped", "#3b82f6", body, frontendUrl),
  };
};

/**
 * 4. ORDER DELIVERED EMAIL TEMPLATE
 */
export const renderOrderDeliveredEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">Your Order has been Delivered! 🎁</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, your order <strong>#${data.orderNumber}</strong> has been successfully delivered. We hope you love your new purchase!
    </p>

    <!-- Return Guarantee Note -->
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #166534;">🛡️ 7-Day Return & Replacement Guarantee</div>
      <div style="font-size: 12px; color: #15803d; margin-top: 2px;">
        Not completely satisfied? You can easily request a return or refund from your order details page within the next 7 days.
      </div>
    </div>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #059669; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
        View Order & Leave a Review →
      </a>
    </div>
  `;

  return {
    subject: `Delivered: Order #${data.orderNumber} - Enjoy your items!`,
    html: renderEmailShell("Order Delivered", "Delivered", "#059669", body, frontendUrl),
  };
};

/**
 * 5. ORDER CANCELLED EMAIL TEMPLATE
 */
export const renderOrderCancelledEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #991b1b;">Order Cancellation Notice ⚠️</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, your order <strong>#${data.orderNumber}</strong> has been cancelled.
    </p>

    <!-- Cancellation details -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 13px; font-weight: 700; color: #991b1b;">Reason for Cancellation</div>
      <div style="font-size: 13px; color: #b91c1c; margin-top: 2px;">
        ${data.cancelReason || "Cancelled upon customer/administrative request."}
      </div>
      ${
        data.paymentStatus === "COMPLETED" || data.paymentStatus === "REFUNDED"
          ? `<div style="font-size: 12px; color: #991b1b; margin-top: 8px; font-weight: 600;">
              💳 Any prepaid amounts will be refunded to your original payment method within 5-7 business days.
            </div>`
          : ""
      }
    </div>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #dc2626; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3);">
        View Order Status →
      </a>
    </div>
  `;

  return {
    subject: `Order #${data.orderNumber} has been Cancelled`,
    html: renderEmailShell("Order Cancelled", "Cancelled", "#dc2626", body, frontendUrl),
  };
};

/**
 * 6. ORDER REFUNDED EMAIL TEMPLATE
 */
export const renderOrderRefundedEmail = (data: OrderEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const orderUrl = `${frontendUrl}/orders/${data.orderId}`;
  const refundAmount = data.refundAmount || data.grandTotal;

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #047857;">Refund Processed Successfully! 💳</h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.customerName}</strong>, we have processed a refund of <strong>${formatCurrency(refundAmount)}</strong> for your order <strong>#${data.orderNumber}</strong>.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #166534;">Refund Breakdown</div>
      <div style="font-size: 18px; font-weight: 900; color: #059669; margin-top: 4px;">${formatCurrency(refundAmount)}</div>
      <div style="font-size: 12px; color: #15803d; margin-top: 4px;">
        The funds have been credited or remitted to your original source of payment (Razorpay / Bank / Card). Depending on your bank, it may take 3 to 7 working days to appear on your statement.
      </div>
    </div>

    ${renderOrderItemsTable(data.items, data.backendUrl, data.frontendUrl)}

    <div style="text-align: center; margin-top: 28px;">
      <a href="${orderUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #059669; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
        View Return & Refund Summary →
      </a>
    </div>
  `;

  return {
    subject: `Refund Processed for Order #${data.orderNumber} (${formatCurrency(refundAmount)})`,
    html: renderEmailShell("Refund Processed", "Refunded", "#059669", body, frontendUrl),
  };
};

/**
 * 7. VENDOR LOW-STOCK ALERT EMAIL TEMPLATE
 */
export const renderVendorLowStockAlertEmail = (data: LowStockEmailData): { subject: string; html: string } => {
  const frontendUrl = data.frontendUrl || "http://localhost:3000";
  const vendorProductsUrl = `${frontendUrl}/vendor/products`;

  const variantStr = data.variantAttributes && Object.keys(data.variantAttributes).length > 0
    ? ` (${Object.entries(data.variantAttributes).map(([k, v]) => `${k}: ${v}`).join(", ")})`
    : "";

  const isOutOfStock = data.currentStock <= 0;
  const statusColor = isOutOfStock ? "#dc2626" : "#f59e0b";
  const statusText = isOutOfStock ? "OUT OF STOCK" : "LOW STOCK WARNING";

  const body = `
    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a;">
      ${isOutOfStock ? "🚨 Product Out of Stock!" : "⚠️ Product Stock Alert"}
    </h1>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #475569; line-height: 1.5;">
      Hello <strong>${data.vendorName}</strong>, your product <strong>${data.productName}${variantStr}</strong> has reached or fallen below your minimum inventory threshold.
    </p>

    <!-- Stock Metrics Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
      <tr>
        <td style="width: 60px; vertical-align: middle;">
          ${renderProductThumbnail(
            data.productImage,
            data.productName,
            54,
            "📦",
            data.backendUrl,
            data.frontendUrl
          )}
        </td>
        <td style="padding-left: 14px;">
          <div style="font-size: 14px; font-weight: 700; color: #92400e;">${data.productName}${variantStr}</div>
          ${data.sku ? `<div style="font-size: 11px; color: #b45309; margin-top: 2px;">SKU: <strong>${data.sku}</strong></div>` : ""}
          <div style="margin-top: 6px;">
            <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 800; border-radius: 6px; background-color: ${statusColor}; color: #ffffff;">
              Remaining Stock: ${data.currentStock} units
            </span>
            <span style="font-size: 12px; color: #78350f; margin-left: 8px;">(Threshold: ${data.threshold})</span>
          </div>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
      When a product runs out of stock, customers will not be able to purchase it on the marketplace. Please restock soon to ensure uninterrupted sales.
    </p>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${vendorProductsUrl}" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 700; color: #ffffff; background-color: #059669; text-decoration: none; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.3);">
        Update Stock in Vendor Portal →
      </a>
    </div>
  `;

  return {
    subject: `[${statusText}] ${data.productName} (${data.currentStock} units left) - Vendor Alert`,
    html: renderEmailShell("Inventory Alert", statusText, statusColor, body, frontendUrl),
  };
};
