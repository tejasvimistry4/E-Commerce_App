import PDFDocument from "pdfkit";
import { OrderDocumentData } from "./pdf.types";
import {
  drawBadge,
  formatCurrency,
  formatDate,
  formatShortDate,
  formatVariantInfo,
  getStatusStyle,
  parseAddress,
} from "./pdf.helpers";

/**
 * Generates a clean, professional, well-structured Order Receipt / Confirmation PDF.
 */
export async function generateOrderReceiptPdf(
  order: OrderDocumentData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Order Confirmation #${order.orderNumber}`,
          Author: "E-Commerce Store",
          Subject: `Order Confirmation #${order.orderNumber}`,
          Keywords: "Order, Receipt, Confirmation, E-Commerce",
          CreationDate: new Date(),
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ==================================================================
      // DESIGN SYSTEM & PALETTE
      // ==================================================================
      const C = {
        primary: "#4F46E5",
        primaryDark: "#3730A3",
        primaryLight: "#EEF2FF",
        primaryBorder: "#C7D2FE",

        ink: "#0F172A",
        text: "#1E293B",
        textSecondary: "#475569",
        textMuted: "#64748B",
        textLight: "#94A3B8",

        border: "#E2E8F0",
        borderLight: "#F1F5F9",
        surface: "#F8FAFC",
        surfaceDark: "#F1F5F9",
        white: "#FFFFFF",

        success: "#059669",
        successLight: "#ECFDF5",
      };

      const pageWidth = doc.page.width; // 595.28
      const pageHeight = doc.page.height; // 841.89

      const left = 36;
      const right = 36;
      const contentWidth = pageWidth - left - right; // 523.28

      const footerHeight = 45;
      const maxContentY = pageHeight - footerHeight - 20; // 776.89

      // ==================================================================
      // COMMON DRAWING HELPERS
      // ==================================================================
      const drawTopBar = () => {
        doc.rect(0, 0, pageWidth, 4).fill(C.primary);
      };

      const drawCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        radius = 6
      ) => {
        doc
          .roundedRect(x, y, w, h, radius)
          .fillAndStroke(C.white, C.border);
      };

      const drawCardHeader = (
        x: number,
        y: number,
        w: number,
        title: string
      ) => {
        doc
          .roundedRect(x, y, w, 22, 6)
          .fill(C.surfaceDark);
        // Square out bottom corners of header
        doc.rect(x, y + 10, w, 12).fill(C.surfaceDark);

        doc
          .font("Helvetica-Bold")
          .fontSize(7)
          .fillColor(C.textSecondary)
          .text(title.toUpperCase(), x + 10, y + 7);
      };

      const drawSectionHeading = (
        title: string,
        subtitle: string | undefined,
        y: number
      ): number => {
        doc
          .font("Helvetica-Bold")
          .fontSize(9.5)
          .fillColor(C.ink)
          .text(title, left, y);

        if (subtitle) {
          doc
            .font("Helvetica")
            .fontSize(6.8)
            .fillColor(C.textMuted)
            .text(subtitle, left, y + 13);
          return y + 26;
        }

        return y + 18;
      };

      const addNewPage = (continuedTitle?: string): number => {
        doc.addPage();
        drawTopBar();

        if (continuedTitle) {
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(C.textMuted)
            .text(continuedTitle, left, 22);

          doc
            .moveTo(left, 36)
            .lineTo(pageWidth - right, 36)
            .strokeColor(C.border)
            .lineWidth(0.5)
            .stroke();

          return 46;
        }

        return 30;
      };

      // ==================================================================
      // PAGE 1 HEADER
      // ==================================================================
      drawTopBar();

      let currentY = 20;

      // Brand Logo Badge
      doc
        .roundedRect(left, currentY, 40, 40, 8)
        .fill(C.primary);

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor(C.white)
        .text("E", left, currentY + 9, {
          width: 40,
          align: "center",
        });

      // Brand Info
      doc
        .font("Helvetica-Bold")
        .fontSize(15)
        .fillColor(C.ink)
        .text("E-COMMERCE STORE", left + 50, currentY + 1);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.textSecondary)
        .text("Order Confirmation & Receipt", left + 50, currentY + 19);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(C.textMuted)
        .text(
          "support@store.com  •  www.store.com  •  +91 1800-123-STORE",
          left + 50,
          currentY + 30
        );

      // Order Confirmation Tile (Right Header)
      const orderBoxWidth = 190;
      const orderBoxHeight = 62;
      const orderBoxX = pageWidth - right - orderBoxWidth;

      doc
        .roundedRect(orderBoxX, currentY, orderBoxWidth, orderBoxHeight, 7)
        .fillAndStroke(C.primaryLight, C.primaryBorder);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(C.primary)
        .text("ORDER CONFIRMATION", orderBoxX + 11, currentY + 8);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(C.ink)
        .text(`#${order.orderNumber}`, orderBoxX + 11, currentY + 21);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(C.textSecondary)
        .text(
          `Date: ${formatDate(order.createdAt)}`,
          orderBoxX + 11,
          currentY + 41,
          {
            width: orderBoxWidth - 22,
            ellipsis: true,
          }
        );

      currentY += 72;

      // Header Divider Line
      doc
        .moveTo(left, currentY)
        .lineTo(pageWidth - right, currentY)
        .strokeColor(C.border)
        .lineWidth(0.6)
        .stroke();

      currentY += 12;

      // ==================================================================
      // ORDER STATUS / METADATA BAR (4 Columns)
      // ==================================================================
      const statusHeight = 48;

      doc
        .roundedRect(left, currentY, contentWidth, statusHeight, 6)
        .fillAndStroke(C.surface, C.border);

      const statusColWidth = contentWidth / 4;

      const drawStatusColumn = (
        index: number,
        label: string,
        value: string,
        options?: { badge?: ReturnType<typeof getStatusStyle> }
      ) => {
        const x = left + statusColWidth * index;

        if (index > 0) {
          doc
            .moveTo(x, currentY + 8)
            .lineTo(x, currentY + statusHeight - 8)
            .strokeColor(C.border)
            .lineWidth(0.5)
            .stroke();
        }

        doc
          .font("Helvetica-Bold")
          .fontSize(6.5)
          .fillColor(C.textMuted)
          .text(label.toUpperCase(), x + 10, currentY + 8);

        if (options?.badge) {
          drawBadge(
            doc,
            x + 10,
            currentY + 22,
            statusColWidth - 20,
            18,
            options.badge.text,
            options.badge
          );
        } else {
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(C.ink)
            .text(value, x + 10, currentY + 24, {
              width: statusColWidth - 20,
              ellipsis: true,
            });
        }
      };

      drawStatusColumn(0, "Order Date", formatShortDate(order.createdAt));
      drawStatusColumn(1, "Order Status", "", {
        badge: getStatusStyle(order.status),
      });

      const paymentMethod =
        order.paymentMethod === "CASH_ON_DELIVERY"
          ? "Cash on Delivery"
          : order.paymentMethod.replace(/_/g, " ");

      drawStatusColumn(2, "Payment Method", paymentMethod);
      drawStatusColumn(3, "Payment Status", "", {
        badge: getStatusStyle(order.paymentStatus),
      });

      currentY += statusHeight + 14;

      // ==================================================================
      // CUSTOMER & SHIPPING CARDS
      // ==================================================================
      currentY = drawSectionHeading(
        "Customer & Delivery Information",
        "Recipient and delivery destination details",
        currentY
      );

      const cardGap = 12;
      const cardWidth = (contentWidth - cardGap) / 2;
      const cardHeight = 98;

      const shippingAddr = parseAddress(order.shippingAddress);
      const customerName =
        order.user?.name || shippingAddr?.fullName || "Customer";

      // --- Left Card: Customer Details ---
      drawCard(left, currentY, cardWidth, cardHeight);
      drawCardHeader(left, currentY, cardWidth, "Customer Details");

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(C.ink)
        .text(customerName, left + 10, currentY + 31, {
          width: cardWidth - 20,
          ellipsis: true,
        });

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.textSecondary)
        .text(`Email:  ${order.user?.email || "N/A"}`, left + 10, currentY + 46, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(`Phone:  ${shippingAddr?.phone || "N/A"}`, left + 10, currentY + 59, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(
          `Customer ID:  ${(order.userId || "N/A").substring(0, 18)}...`,
          left + 10,
          currentY + 76,
          {
            width: cardWidth - 20,
            ellipsis: true,
          }
        );

      // --- Right Card: Shipping Destination ---
      const shippingX = left + cardWidth + cardGap;
      drawCard(shippingX, currentY, cardWidth, cardHeight);
      drawCardHeader(shippingX, currentY, cardWidth, "Shipping Destination");

      const recipientName = shippingAddr?.fullName || customerName;

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(C.ink)
        .text(recipientName, shippingX + 10, currentY + 31, {
          width: cardWidth - 20,
          ellipsis: true,
        });

      if (shippingAddr) {
        const street = shippingAddr.streetAddress || "Standard Address";
        const cityState = [
          shippingAddr.city,
          shippingAddr.state,
          shippingAddr.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(C.textSecondary)
          .text(street, shippingX + 10, currentY + 46, {
            width: cardWidth - 20,
            ellipsis: true,
          })
          .text(cityState || "India", shippingX + 10, currentY + 59, {
            width: cardWidth - 20,
            ellipsis: true,
          })
          .text(
            `${shippingAddr.country || "India"}  •  Phone: ${shippingAddr.phone || "N/A"}`,
            shippingX + 10,
            currentY + 76,
            {
              width: cardWidth - 20,
              ellipsis: true,
            }
          );
      } else {
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.textMuted)
          .text("Standard Home Delivery", shippingX + 10, currentY + 48);
      }

      currentY += cardHeight + 14;

      // ==================================================================
      // ITEMS TABLE SECTION
      // ==================================================================
      currentY = drawSectionHeading(
        "Order Items",
        `${order.items.length} item${order.items.length === 1 ? "" : "s"} included in this order`,
        currentY
      );

      const tableHeaderHeight = 24;

      // Column widths: Total = 523.28
      const colW = {
        sno: 26,
        item: 245,
        qty: 40,
        rate: 95,
        total: 117.28,
      };

      const colX = {
        sno: left,
        item: left + colW.sno,
        qty: left + colW.sno + colW.item,
        rate: left + colW.sno + colW.item + colW.qty,
        total: left + colW.sno + colW.item + colW.qty + colW.rate,
      };

      const renderTableHeader = (y: number): number => {
        doc
          .roundedRect(left, y, contentWidth, tableHeaderHeight, 5)
          .fill(C.ink);

        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.white);

        doc.text("#", colX.sno, y + 8, {
          width: colW.sno,
          align: "center",
        });

        doc.text("ITEM & SPECIFICATIONS", colX.item + 8, y + 8, {
          width: colW.item - 12,
        });

        doc.text("QTY", colX.qty, y + 8, {
          width: colW.qty,
          align: "center",
        });

        doc.text("UNIT PRICE", colX.rate, y + 8, {
          width: colW.rate - 8,
          align: "right",
        });

        doc.text("TOTAL", colX.total, y + 8, {
          width: colW.total - 10,
          align: "right",
        });

        return y + tableHeaderHeight;
      };

      currentY = renderTableHeader(currentY);

      // ==================================================================
      // TABLE ROWS RENDERING
      // ==================================================================
      order.items.forEach((item, index) => {
        const variantText = formatVariantInfo(item);
        const itemName = item.name || "Product";

        // Calculate dynamic line heights
        doc.font("Helvetica-Bold").fontSize(7.8);
        const nameHeight = doc.heightOfString(itemName, {
          width: colW.item - 16,
        });

        doc.font("Helvetica").fontSize(6.6);
        const variantHeight = variantText
          ? doc.heightOfString(variantText, {
              width: colW.item - 16,
            })
          : 0;

        const rowHeight = Math.max(
          28,
          8 + nameHeight + (variantText ? 2 + variantHeight : 0) + 8
        );

        // Page break if row crosses max content bound
        if (currentY + rowHeight > maxContentY) {
          currentY = addNewPage(
            `ORDER CONFIRMATION #${order.orderNumber} — ITEMS CONTINUED`
          );
          currentY = renderTableHeader(currentY);
        }

        const rowY = currentY;

        // Alternating background
        if (index % 2 === 0) {
          doc
            .rect(left, rowY, contentWidth, rowHeight)
            .fill(C.surface);
        }

        // Serial Number
        doc
          .font("Helvetica")
          .fontSize(7.2)
          .fillColor(C.textMuted)
          .text(String(index + 1), colX.sno, rowY + 8, {
            width: colW.sno,
            align: "center",
          });

        // Item Name
        doc
          .font("Helvetica-Bold")
          .fontSize(7.8)
          .fillColor(C.ink)
          .text(itemName, colX.item + 8, rowY + 7, {
            width: colW.item - 16,
          });

        // Variant Specs
        if (variantText) {
          doc
            .font("Helvetica")
            .fontSize(6.6)
            .fillColor(C.textMuted)
            .text(variantText, colX.item + 8, rowY + 7 + nameHeight + 2, {
              width: colW.item - 16,
            });
        }

        // Quantity
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(C.ink)
          .text(String(item.quantity), colX.qty, rowY + 8, {
            width: colW.qty,
            align: "center",
          });

        // Unit Price
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.textSecondary)
          .text(formatCurrency(item.price), colX.rate, rowY + 8, {
            width: colW.rate - 8,
            align: "right",
          });

        // Line Total
        const lineTotal =
          item.totalPrice !== undefined
            ? item.totalPrice
            : item.price * item.quantity;

        doc
          .font("Helvetica-Bold")
          .fontSize(7.8)
          .fillColor(C.ink)
          .text(formatCurrency(lineTotal), colX.total, rowY + 8, {
            width: colW.total - 10,
            align: "right",
          });

        // Row Bottom Divider
        doc
          .moveTo(left, rowY + rowHeight)
          .lineTo(pageWidth - right, rowY + rowHeight)
          .strokeColor(C.border)
          .lineWidth(0.5)
          .stroke();

        currentY += rowHeight;
      });

      currentY += 14;

      // ==================================================================
      // FINANCIAL SUMMARY & PAYMENT NOTES
      // ==================================================================
      const summaryBlockHeight = 135;

      if (currentY + summaryBlockHeight > maxContentY) {
        currentY = addNewPage(
          `ORDER CONFIRMATION #${order.orderNumber} — PAYMENT SUMMARY`
        );
      }

      currentY = drawSectionHeading(
        "Payment Summary",
        "Order pricing and financial breakdown",
        currentY
      );

      const summaryGap = 14;
      const summaryWidth = 235;
      const notesWidth = contentWidth - summaryWidth - summaryGap;
      const summaryCardHeight = 110;

      // --- Left Card: Notes & Reference ---
      drawCard(left, currentY, notesWidth, summaryCardHeight);
      drawCardHeader(left, currentY, notesWidth, "Payment Reference & Instructions");

      let noteY = currentY + 30;

      if (order.razorpayPaymentId) {
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textSecondary)
          .text("Payment Ref:", left + 10, noteY);

        doc
          .font("Helvetica")
          .fontSize(6.8)
          .fillColor(C.ink)
          .text(order.razorpayPaymentId, left + 75, noteY, {
            width: notesWidth - 85,
            ellipsis: true,
          });

        noteY += 14;
      }

      if (order.notes) {
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textSecondary)
          .text("Instructions:", left + 10, noteY);

        doc
          .font("Helvetica")
          .fontSize(6.8)
          .fillColor(C.ink)
          .text(order.notes, left + 75, noteY, {
            width: notesWidth - 85,
            height: 24,
            ellipsis: true,
          });

        noteY += 26;
      }

      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(C.textMuted)
        .text(
          "• Please keep this receipt for order verification and package delivery.",
          left + 10,
          noteY,
          { width: notesWidth - 20 }
        )
        .text(
          "• 7-Day replacement guarantee applies on eligible items.",
          left + 10,
          noteY + 11,
          { width: notesWidth - 20 }
        );

      // --- Right Card: Price Breakdown ---
      const summaryX = left + notesWidth + summaryGap;
      drawCard(summaryX, currentY, summaryWidth, summaryCardHeight);

      let summaryY = currentY + 10;

      const drawSummaryRow = (
        label: string,
        value: string,
        color = C.text,
        bold = false
      ) => {
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.2)
          .fillColor(C.textMuted)
          .text(label, summaryX + 10, summaryY, { width: 110 });

        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(color)
          .text(value, summaryX + 115, summaryY, {
            width: summaryWidth - 125,
            align: "right",
          });

        summaryY += 14;
      };

      drawSummaryRow("Items Subtotal", formatCurrency(order.subtotal));

      if (order.discount > 0) {
        const discountLabel = order.couponCode
          ? `Coupon (${order.couponCode})`
          : "Discount Applied";
        drawSummaryRow(
          discountLabel,
          `- ${formatCurrency(order.discount)}`,
          C.success,
          true
        );
      }

      drawSummaryRow(
        "Shipping Fee",
        order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee),
        order.shippingFee === 0 ? C.success : C.text,
        order.shippingFee === 0
      );

      if (order.tax > 0) {
        drawSummaryRow("Estimated Taxes / GST", formatCurrency(order.tax));
      }

      // Grand Total Highlight Banner
      summaryY += 2;
      doc
        .roundedRect(
          summaryX + 6,
          summaryY,
          summaryWidth - 12,
          30,
          5
        )
        .fill(C.primary);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(C.white)
        .text("GRAND TOTAL", summaryX + 14, summaryY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(C.white)
        .text(formatCurrency(order.grandTotal), summaryX + 100, summaryY + 8, {
          width: summaryWidth - 114,
          align: "right",
        });

      // ==================================================================
      // FOOTER ON EVERY PAGE (Rendered via Page Buffer)
      // ==================================================================
      const pageRange = doc.bufferedPageRange();

      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);

        const footerY = pageHeight - 38;

        // Divider
        doc
          .moveTo(left, footerY - 8)
          .lineTo(pageWidth - right, footerY - 8)
          .strokeColor(C.border)
          .lineWidth(0.5)
          .stroke();

        // Left note
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textSecondary)
          .text("Thank you for shopping with us!", left, footerY);

        doc
          .font("Helvetica")
          .fontSize(6.3)
          .fillColor(C.textMuted)
          .text(
            "For returns or support, contact support@store.com",
            left,
            footerY + 10
          );

        // Center contact
        doc
          .font("Helvetica")
          .fontSize(6.3)
          .fillColor(C.textMuted)
          .text("www.store.com", pageWidth / 2 - 40, footerY + 10, {
            width: 80,
            align: "center",
          });

        // Right Page Number
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textMuted)
          .text(
            `Page ${i + 1} of ${pageRange.count}`,
            pageWidth - right - 80,
            footerY + 10,
            {
              width: 80,
              align: "right",
            }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}