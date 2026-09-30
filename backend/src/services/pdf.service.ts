import {
  OrderDocumentData,
  OrderItemDocumentData,
  OrderUserDocumentData,
  OrderAddressDocumentData,
  generateOrderReceiptPdf,
  generateInvoicePdf,
  parseAddress,
} from "../templates/pdf";

// Re-export types for backward compatibility across modules
export {
  OrderDocumentData,
  OrderItemDocumentData,
  OrderUserDocumentData,
  OrderAddressDocumentData,
};

/**
 * Service handling all PDF generation business logic,
 * data validation, financial calculations, and data normalization.
 */
export class PdfService {
  /**
   * Normalizes and validates raw order data before passing it to PDF templates.
   */
  private prepareOrderData(order: OrderDocumentData): OrderDocumentData {
    if (!order) {
      throw new Error("Cannot generate PDF: Order data is required");
    }

    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      throw new Error(`Cannot generate PDF for Order #${order.orderNumber || "UNKNOWN"}: Order contains no items`);
    }

    // Sanitize financial numbers
    const subtotal = Math.max(0, Number(order.subtotal) || 0);
    const discount = Math.max(0, Number(order.discount) || 0);
    const shippingFee = Math.max(0, Number(order.shippingFee) || 0);
    const grandTotal = Math.max(0, Number(order.grandTotal) || 0);
    
    // Tax calculation fallback if not explicitly recorded
    let tax = Math.max(0, Number(order.tax) || 0);
    if (tax <= 0 && grandTotal > 0) {
      // Calculate inclusive 18% GST (standard Indian e-commerce rate)
      tax = Math.round(((grandTotal * 0.18) / 1.18) * 100) / 100;
    }

    // Normalize addresses
    const shippingAddress = parseAddress(order.shippingAddress) || {
      fullName: order.user?.name || "Customer",
      streetAddress: "Standard Delivery Address",
      country: "India",
    };

    const billingAddress = parseAddress(order.billingAddress) || shippingAddress;

    // Normalize items and verify line totals
    const normalizedItems: OrderItemDocumentData[] = order.items.map((item, index) => {
      const price = Math.max(0, Number(item.price) || 0);
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const totalPrice = item.totalPrice !== undefined ? Math.max(0, Number(item.totalPrice)) : price * quantity;

      return {
        id: item.id || `item_${index + 1}`,
        productId: item.productId,
        variantId: item.variantId,
        variantAttributes: item.variantAttributes,
        name: item.name || "Product",
        image: item.image,
        price,
        quantity,
        totalPrice,
        variant: item.variant,
      };
    });

    return {
      ...order,
      orderNumber: order.orderNumber || "ORD-000000",
      status: (order.status || "PENDING").toUpperCase(),
      paymentMethod: (order.paymentMethod || "ONLINE").toUpperCase(),
      paymentStatus: (order.paymentStatus || "PENDING").toUpperCase(),
      subtotal,
      discount,
      shippingFee,
      tax,
      grandTotal,
      shippingAddress,
      billingAddress,
      items: normalizedItems,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * 1. Generate Order PDF (Order Confirmation & Packing Slip)
   * Applies business rules and feeds prepared data into the order receipt template.
   */
  async generateOrderPdf(rawOrder: OrderDocumentData): Promise<Buffer> {
    try {
      const preparedOrder = this.prepareOrderData(rawOrder);
      return await generateOrderReceiptPdf(preparedOrder);
    } catch (error: any) {
      console.error(`[PdfService] Failed to generate Order Receipt PDF for #${rawOrder?.orderNumber}:`, error);
      throw new Error(`Order PDF generation failed: ${error.message}`);
    }
  }

  /**
   * 2. Generate Bill / Tax Invoice PDF (Official GST Commercial Invoice)
   * Applies commercial business rules and feeds prepared data into the invoice template.
   */
  async generateInvoicePdf(rawOrder: OrderDocumentData): Promise<Buffer> {
    try {
      const preparedOrder = this.prepareOrderData(rawOrder);
      return await generateInvoicePdf(preparedOrder);
    } catch (error: any) {
      console.error(`[PdfService] Failed to generate Tax Invoice PDF for #${rawOrder?.orderNumber}:`, error);
      throw new Error(`Tax Invoice generation failed: ${error.message}`);
    }
  }
}

export const pdfService = new PdfService();
export default pdfService;
