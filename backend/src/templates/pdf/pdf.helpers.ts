import PDFKit from "pdfkit";
import {
  OrderAddressDocumentData,
  OrderItemDocumentData,
  StatusBadgeStyle,
} from "./pdf.types";

/**
 * Format currency to Indian Rupees (Rs. X,XXX.XX)
 */
export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Full date & time format (e.g. 18 Sep 2026, 03:30 PM)
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Short date format (e.g. 18 Sep 2026)
 */
export function formatShortDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Parse address whether it is stored as an object or JSON string
 */
export function parseAddress(addr: any): OrderAddressDocumentData | null {
  if (!addr) return null;
  if (typeof addr === "string") {
    try {
      return JSON.parse(addr);
    } catch {
      return { streetAddress: addr };
    }
  }
  return addr;
}

/**
 * Format variant attributes, size, color, and SKU into a readable single-line string
 */
export function formatVariantInfo(item: any): string {
  if (!item) return "";
  const parts: string[] = [];

  // Check item.variantAttributes record
  if (item.variantAttributes && typeof item.variantAttributes === "object") {
    for (const [k, v] of Object.entries(item.variantAttributes)) {
      if (v) parts.push(`${k}: ${v}`);
    }
  }

  // Check item.variant object
  if (item.variant) {
    if (typeof item.variant === "string") {
      parts.push(item.variant);
    } else if (typeof item.variant === "object") {
      if (item.variant.attributes && typeof item.variant.attributes === "object") {
        for (const [k, v] of Object.entries(item.variant.attributes)) {
          const entry = `${k}: ${v}`;
          if (!parts.includes(entry)) parts.push(entry);
        }
      }
      if (item.variant.name && !parts.includes(item.variant.name)) {
        parts.push(item.variant.name);
      }
      if (item.variant.size && !parts.some((p) => p.includes(`Size: ${item.variant.size}`))) {
        parts.push(`Size: ${item.variant.size}`);
      }
      if (item.variant.color && !parts.some((p) => p.includes(`Color: ${item.variant.color}`))) {
        parts.push(`Color: ${item.variant.color}`);
      }
      if (item.variant.sku && !parts.some((p) => p.includes(`SKU: ${item.variant.sku}`))) {
        parts.push(`SKU: ${item.variant.sku}`);
      }
    }
  }

  // Support direct size/color fields if present
  if (item.size && !parts.some((p) => p.includes(`Size: ${item.size}`))) {
    parts.push(`Size: ${item.size}`);
  }

  if (item.color && !parts.some((p) => p.includes(`Color: ${item.color}`))) {
    parts.push(`Color: ${item.color}`);
  }

  return parts.join("  •  ");
}

/**
 * Status color and label definition for order and payment badges
 */
export function getStatusStyle(status: string): StatusBadgeStyle {
  const s = (status || "").toUpperCase();
  if (["DELIVERED", "COMPLETED", "PAID", "SUCCESS"].includes(s)) {
    return {
      text: s.replace(/_/g, " "),
      bg: "#ECFDF5",
      border: "#A7F3D0",
      color: "#065F46",
    };
  }
  if (["CANCELLED", "FAILED", "RETURNED", "REFUNDED"].includes(s)) {
    return {
      text: s.replace(/_/g, " "),
      bg: "#FEF2F2",
      border: "#FECACA",
      color: "#991B1B",
    };
  }
  if (["PROCESSING", "CONFIRMED", "SHIPPED", "IN_TRANSIT"].includes(s)) {
    return {
      text: s.replace(/_/g, " "),
      bg: "#EFF6FF",
      border: "#BFDBFE",
      color: "#1E40AF",
    };
  }
  return {
    text: s.replace(/_/g, " ") || "PENDING",
    bg: "#FFFBEB",
    border: "#FDE68A",
    color: "#92400E",
  };
}

/**
 * Draw a clean rounded status badge pill in PDFKit
 */
export function drawBadge(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  text: string,
  style: StatusBadgeStyle
): void {
  doc
    .roundedRect(x, y, width, height, 4)
    .fillAndStroke(style.bg, style.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(7)
    .fillColor(style.color)
    .text(text, x, y + Math.max(0, (height - 8) / 2), {
      width,
      align: "center",
    });
}
