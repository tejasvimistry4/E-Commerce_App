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
 * Generates a clean, professional, well-structured GST Tax Invoice PDF.
 */
export async function generateInvoicePdf(
  order: OrderDocumentData
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 0,
        bufferPages: true,
        info: {
          Title: `Tax Invoice INV-${order.orderNumber}`,
          Author: "E-Commerce Store Pvt. Ltd.",
          Subject: `Tax Invoice for Order #${order.orderNumber}`,
          Keywords: "GST, Tax Invoice, Commercial Invoice, Invoice",
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

        navy: "#0F172A",
        ink: "#0F172A",
        text: "#1E293B",
        textSecondary: "#475569",
        textMuted: "#64748B",
        textLight: "#94A3B8",

        border: "#CBD5E1",
        borderLight: "#E2E8F0",
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
          .fillAndStroke(C.white, C.borderLight);
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
          .fillColor(C.navy)
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
            .strokeColor(C.borderLight)
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

      // Corporate Logo Badge
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

      // Corporate Seller Name
      doc
        .font("Helvetica-Bold")
        .fontSize(14.5)
        .fillColor(C.navy)
        .text("E-COMMERCE STORE PVT. LTD.", left + 50, currentY + 1);

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.textSecondary)
        .text("Commercial GST Tax Invoice", left + 50, currentY + 19);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(C.textMuted)
        .text(
          "billing@store.com  •  www.store.com  •  +91 1800-123-STORE",
          left + 50,
          currentY + 30
        );

      // Tax Invoice Tile (Right Header)
      const invoiceBoxWidth = 190;
      const invoiceBoxHeight = 68;
      const invoiceBoxX = pageWidth - right - invoiceBoxWidth;

      doc
        .roundedRect(invoiceBoxX, currentY, invoiceBoxWidth, invoiceBoxHeight, 7)
        .fillAndStroke(C.primaryLight, C.primaryBorder);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(C.primary)
        .text("TAX INVOICE", invoiceBoxX + 11, currentY + 8);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(C.navy)
        .text(`INV-${order.orderNumber}`, invoiceBoxX + 11, currentY + 21);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(C.textSecondary)
        .text(
          `Invoice Date: ${formatShortDate(order.createdAt)}`,
          invoiceBoxX + 11,
          currentY + 39
        )
        .text(
          "Original for Recipient",
          invoiceBoxX + 11,
          currentY + 51,
          {
            width: invoiceBoxWidth - 22,
          }
        );

      currentY += 78;

      // Header Divider Line
      doc
        .moveTo(left, currentY)
        .lineTo(pageWidth - right, currentY)
        .strokeColor(C.borderLight)
        .lineWidth(0.6)
        .stroke();

      currentY += 10;

      // ==================================================================
      // SELLER LEGAL & TAX REGISTRATION BAR
      // ==================================================================
      const legalHeight = 42;

      drawCard(left, currentY, contentWidth, legalHeight, 6);

      doc
        .font("Helvetica-Bold")
        .fontSize(6.5)
        .fillColor(C.textSecondary)
        .text("SELLER / TAX REGISTRATION DETAILS", left + 10, currentY + 7);

      doc
        .font("Helvetica")
        .fontSize(6.8)
        .fillColor(C.text)
        .text("CIN:  U72900KA2024PTC123456", left + 10, currentY + 18)
        .text("GSTIN:  29AABCL1234F1Z8", left + 180, currentY + 18)
        .text("PAN:  AABCL1234F", left + 340, currentY + 18);

      doc
        .font("Helvetica")
        .fontSize(6.4)
        .fillColor(C.textMuted)
        .text(
          "Registered Office: Tech Hub Plaza, 4th Floor, Indiranagar, Bangalore, Karnataka - 560038",
          left + 10,
          currentY + 29,
          { width: contentWidth - 20 }
        );

      currentY += legalHeight + 10;

      // ==================================================================
      // INVOICE METADATA BAR (4 Columns)
      // ==================================================================
      const metaHeight = 48;

      doc
        .roundedRect(left, currentY, contentWidth, metaHeight, 6)
        .fillAndStroke(C.surface, C.borderLight);

      const metaColWidth = contentWidth / 4;

      const shippingAddr = parseAddress(order.shippingAddress);
      const billingAddr = parseAddress(order.billingAddress) || shippingAddr;

      const drawMetaColumn = (
        index: number,
        label: string,
        value: string,
        options?: { badge?: ReturnType<typeof getStatusStyle> }
      ) => {
        const x = left + metaColWidth * index;

        if (index > 0) {
          doc
            .moveTo(x, currentY + 8)
            .lineTo(x, currentY + metaHeight - 8)
            .strokeColor(C.borderLight)
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
            metaColWidth - 20,
            18,
            options.badge.text,
            options.badge
          );
        } else {
          doc
            .font("Helvetica-Bold")
            .fontSize(8)
            .fillColor(C.navy)
            .text(value, x + 10, currentY + 24, {
              width: metaColWidth - 20,
              ellipsis: true,
            });
        }
      };

      drawMetaColumn(0, "Order Number", `#${order.orderNumber}`);
      drawMetaColumn(1, "Place of Supply", shippingAddr?.state || "Karnataka");

      const paymentMethod =
        order.paymentMethod === "CASH_ON_DELIVERY"
          ? "Cash on Delivery"
          : order.paymentMethod.replace(/_/g, " ");

      drawMetaColumn(2, "Payment Mode", paymentMethod);
      drawMetaColumn(3, "Payment Status", "", {
        badge: getStatusStyle(order.paymentStatus),
      });

      currentY += metaHeight + 14;

      // ==================================================================
      // BILL TO / SHIP TO ADDRESS CARDS
      // ==================================================================
      currentY = drawSectionHeading(
        "Customer & Billing Information",
        "Registered billing entity and physical shipping address",
        currentY
      );

      const cardGap = 12;
      const cardWidth = (contentWidth - cardGap) / 2;
      const cardHeight = 98;

      const buyerName =
        order.user?.name || billingAddr?.fullName || "Customer";

      // --- Left Card: Bill To ---
      drawCard(left, currentY, cardWidth, cardHeight);
      drawCardHeader(left, currentY, cardWidth, "Bill To (Buyer)");

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(C.navy)
        .text(buyerName, left + 10, currentY + 31, {
          width: cardWidth - 20,
          ellipsis: true,
        });

      const billStreet = billingAddr?.streetAddress || "Standard Address";
      const billCityState = [
        billingAddr?.city,
        billingAddr?.state,
        billingAddr?.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.textSecondary)
        .text(billStreet, left + 10, currentY + 46, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(billCityState || "India", left + 10, currentY + 59, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(
          `Email: ${order.user?.email || "N/A"}  •  Phone: ${billingAddr?.phone || "N/A"}`,
          left + 10,
          currentY + 76,
          {
            width: cardWidth - 20,
            ellipsis: true,
          }
        );

      // --- Right Card: Ship To ---
      const shipX = left + cardWidth + cardGap;
      drawCard(shipX, currentY, cardWidth, cardHeight);
      drawCardHeader(shipX, currentY, cardWidth, "Ship To (Delivery)");

      const recipientName =
        shippingAddr?.fullName || order.user?.name || "Recipient";

      doc
        .font("Helvetica-Bold")
        .fontSize(8.5)
        .fillColor(C.navy)
        .text(recipientName, shipX + 10, currentY + 31, {
          width: cardWidth - 20,
          ellipsis: true,
        });

      const shipStreet = shippingAddr?.streetAddress || "Standard Address";
      const shipCityState = [
        shippingAddr?.city,
        shippingAddr?.state,
        shippingAddr?.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(C.textSecondary)
        .text(shipStreet, shipX + 10, currentY + 46, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(shipCityState || "India", shipX + 10, currentY + 59, {
          width: cardWidth - 20,
          ellipsis: true,
        })
        .text(
          `${shippingAddr?.country || "India"}  •  Phone: ${shippingAddr?.phone || "N/A"}`,
          shipX + 10,
          currentY + 76,
          {
            width: cardWidth - 20,
            ellipsis: true,
          }
        );

      currentY += cardHeight + 14;

      // ==================================================================
      // ITEM TABLE SECTION
      // ==================================================================
      currentY = drawSectionHeading(
        "Itemized Tax Invoice",
        "Details of goods supplied, applicable HSN codes and GST rates",
        currentY
      );

      const tableHeaderHeight = 24;

      // Columns configuration: Total width = 523.28
      const colW = {
        sno: 25,
        desc: 195,
        hsn: 55,
        qty: 35,
        rate: 68,
        tax: 45,
        total: 100.28,
      };

      const colX = {
        sno: left,
        desc: left + colW.sno,
        hsn: left + colW.sno + colW.desc,
        qty: left + colW.sno + colW.desc + colW.hsn,
        rate: left + colW.sno + colW.desc + colW.hsn + colW.qty,
        tax: left + colW.sno + colW.desc + colW.hsn + colW.qty + colW.rate,
        total:
          left +
          colW.sno +
          colW.desc +
          colW.hsn +
          colW.qty +
          colW.rate +
          colW.tax,
      };

      const renderTableHeader = (y: number): number => {
        doc
          .roundedRect(left, y, contentWidth, tableHeaderHeight, 5)
          .fill(C.navy);

        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.white);

        doc.text("#", colX.sno, y + 8, {
          width: colW.sno,
          align: "center",
        });

        doc.text("DESCRIPTION & SPECIFICATIONS", colX.desc + 8, y + 8, {
          width: colW.desc - 12,
        });

        doc.text("HSN/SAC", colX.hsn, y + 8, {
          width: colW.hsn,
          align: "center",
        });

        doc.text("QTY", colX.qty, y + 8, {
          width: colW.qty,
          align: "center",
        });

        doc.text("RATE", colX.rate, y + 8, {
          width: colW.rate - 8,
          align: "right",
        });

        doc.text("GST", colX.tax, y + 8, {
          width: colW.tax - 6,
          align: "right",
        });

        doc.text("AMOUNT", colX.total, y + 8, {
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

        // Dynamic height calculation
        doc.font("Helvetica-Bold").fontSize(7.8);
        const nameHeight = doc.heightOfString(itemName, {
          width: colW.desc - 16,
        });

        doc.font("Helvetica").fontSize(6.5);
        const variantHeight = variantText
          ? doc.heightOfString(variantText, {
              width: colW.desc - 16,
            })
          : 0;

        const rowHeight = Math.max(
          28,
          8 + nameHeight + (variantText ? 2 + variantHeight : 0) + 8
        );

        // Page break if row crosses max content bound
        if (currentY + rowHeight > maxContentY) {
          currentY = addNewPage(
            `TAX INVOICE INV-${order.orderNumber} — ITEMS CONTINUED`
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
          .fillColor(C.navy)
          .text(itemName, colX.desc + 8, rowY + 7, {
            width: colW.desc - 16,
          });

        // Variant Specs
        if (variantText) {
          doc
            .font("Helvetica")
            .fontSize(6.5)
            .fillColor(C.textMuted)
            .text(variantText, colX.desc + 8, rowY + 7 + nameHeight + 2, {
              width: colW.desc - 16,
            });
        }

        // HSN Code
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(C.textSecondary)
          .text("6204.00", colX.hsn, rowY + 8, {
            width: colW.hsn,
            align: "center",
          });

        // Quantity
        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(C.navy)
          .text(String(item.quantity), colX.qty, rowY + 8, {
            width: colW.qty,
            align: "center",
          });

        // Rate
        doc
          .font("Helvetica")
          .fontSize(7.5)
          .fillColor(C.textSecondary)
          .text(formatCurrency(item.price), colX.rate, rowY + 8, {
            width: colW.rate - 8,
            align: "right",
          });

        // GST
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor(C.textMuted)
          .text("18%", colX.tax, rowY + 8, {
            width: colW.tax - 6,
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
          .fillColor(C.navy)
          .text(formatCurrency(lineTotal), colX.total, rowY + 8, {
            width: colW.total - 10,
            align: "right",
          });

        // Row Divider
        doc
          .moveTo(left, rowY + rowHeight)
          .lineTo(pageWidth - right, rowY + rowHeight)
          .strokeColor(C.borderLight)
          .lineWidth(0.5)
          .stroke();

        currentY += rowHeight;
      });

      currentY += 14;

      // ==================================================================
      // INVOICE SUMMARY, GST BREAKDOWN & SIGNATORY SECTION
      // ==================================================================
      const summaryBlockHeight = 160;

      if (currentY + summaryBlockHeight > maxContentY) {
        currentY = addNewPage(
          `TAX INVOICE INV-${order.orderNumber} — INVOICE SUMMARY`
        );
      }

      currentY = drawSectionHeading(
        "Invoice Summary & Tax Breakdown",
        "Statutory GST calculation and total amount payable",
        currentY
      );

      const summaryGap = 14;
      const totalBoxWidth = 230;
      const taxBoxWidth = contentWidth - totalBoxWidth - summaryGap;
      const summaryCardHeight = 110;

      // Effective GST Calculation (Inclusive/Exclusive standard fallback)
      const effectiveTax =
        order.tax > 0 ? order.tax : (order.grandTotal * 0.18) / 1.18;
      const cgst = effectiveTax / 2;
      const sgst = effectiveTax / 2;

      // --- Left Card: GST Breakdown ---
      drawCard(left, currentY, taxBoxWidth, summaryCardHeight);
      drawCardHeader(left, currentY, taxBoxWidth, "GST Tax Breakdown");

      let taxY = currentY + 30;

      const drawTaxRow = (label: string, value: string, bold = false) => {
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.2)
          .fillColor(bold ? C.navy : C.textSecondary)
          .text(label, left + 10, taxY, { width: 110 });

        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.5)
          .fillColor(bold ? C.navy : C.text)
          .text(value, left + taxBoxWidth - 110, taxY, {
            width: 100,
            align: "right",
          });

        taxY += 14;
      };

      drawTaxRow("Taxable Value", formatCurrency(order.subtotal));
      drawTaxRow("CGST @ 9%", formatCurrency(cgst));
      drawTaxRow("SGST @ 9%", formatCurrency(sgst));
      drawTaxRow("Total GST (18%)", formatCurrency(effectiveTax), true);

      // Small Note inside Tax Card
      doc
        .font("Helvetica")
        .fontSize(6.2)
        .fillColor(C.textMuted)
        .text(
          "Reverse Charge: No  •  Supply under GST Section 9(1)",
          left + 10,
          taxY + 2
        );

      // --- Right Card: Payable Summary ---
      const totalX = left + taxBoxWidth + summaryGap;
      drawCard(totalX, currentY, totalBoxWidth, summaryCardHeight);

      let totalY = currentY + 10;

      const drawTotalRow = (
        label: string,
        value: string,
        color = C.text,
        bold = false
      ) => {
        doc
          .font(bold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.2)
          .fillColor(C.textMuted)
          .text(label, totalX + 10, totalY, { width: 100 });

        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(color)
          .text(value, totalX + 105, totalY, {
            width: totalBoxWidth - 115,
            align: "right",
          });

        totalY += 14;
      };

      drawTotalRow("Items Subtotal", formatCurrency(order.subtotal));

      if (order.discount > 0) {
        const discountLabel = order.couponCode
          ? `Coupon (${order.couponCode})`
          : "Discount Applied";
        drawTotalRow(
          discountLabel,
          `- ${formatCurrency(order.discount)}`,
          C.success,
          true
        );
      }

      drawTotalRow(
        "Shipping Charges",
        order.shippingFee === 0 ? "FREE" : formatCurrency(order.shippingFee),
        order.shippingFee === 0 ? C.success : C.text,
        order.shippingFee === 0
      );

      drawTotalRow("GST Included", formatCurrency(effectiveTax));

      // Grand Total Highlight Banner
      totalY += 2;
      doc
        .roundedRect(
          totalX + 6,
          totalY,
          totalBoxWidth - 12,
          30,
          5
        )
        .fill(C.primary);

      doc
        .font("Helvetica-Bold")
        .fontSize(7.5)
        .fillColor(C.white)
        .text("TOTAL PAYABLE", totalX + 14, totalY + 10);

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor(C.white)
        .text(formatCurrency(order.grandTotal), totalX + 95, totalY + 8, {
          width: totalBoxWidth - 109,
          align: "right",
        });

      // --- Bottom Section: Reference & Signatory ---
      currentY += summaryCardHeight + 10;

      // Left: Reference & Notes
      let noteInfoY = currentY + 4;
      if (order.razorpayPaymentId) {
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textSecondary)
          .text("Payment Ref: ", left, noteInfoY, { continued: true })
          .font("Helvetica")
          .fillColor(C.navy)
          .text(order.razorpayPaymentId);
        noteInfoY += 12;
      }

      if (order.notes) {
        doc
          .font("Helvetica-Bold")
          .fontSize(6.8)
          .fillColor(C.textSecondary)
          .text("Notes: ", left, noteInfoY, { continued: true })
          .font("Helvetica")
          .fillColor(C.navy)
          .text(order.notes, { width: contentWidth - 210, ellipsis: true });
      }

      // Right: Digital Signatory
      const signWidth = 190;
      const signX = pageWidth - right - signWidth;

      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(C.navy)
        .text("FOR E-COMMERCE STORE PVT. LTD.", signX, currentY + 2, {
          width: signWidth,
          align: "right",
        });

      doc
        .font("Helvetica-Oblique")
        .fontSize(7.5)
        .fillColor(C.primary)
        .text("Digitally Signed", signX, currentY + 14, {
          width: signWidth,
          align: "right",
        });

      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(C.textMuted)
        .text("Authorized Signatory", signX, currentY + 26, {
          width: signWidth,
          align: "right",
        });

      // ==================================================================
      // FOOTER ON EVERY PAGE (Rendered via Page Buffer)
      // ==================================================================
      const pageRange = doc.bufferedPageRange();

      for (let i = pageRange.start; i < pageRange.start + pageRange.count; i++) {
        doc.switchToPage(i);

        const footerY = pageHeight - 38;

        // Top footer divider line
        doc
          .moveTo(left, footerY - 8)
          .lineTo(pageWidth - right, footerY - 8)
          .strokeColor(C.borderLight)
          .lineWidth(0.5)
          .stroke();

        doc
          .font("Helvetica")
          .fontSize(6.2)
          .fillColor(C.textLight)
          .text(
            "This is a computer-generated tax invoice. No physical signature is required.",
            left,
            footerY
          );

        doc
          .font("Helvetica")
          .fontSize(6.2)
          .fillColor(C.textLight)
          .text(`Generated on ${formatDate(new Date())}`, left, footerY + 10);

        // Page number on right
        doc
          .font("Helvetica-Bold")
          .fontSize(6.5)
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
    } catch (error) {
      reject(error);
    }
  });
}