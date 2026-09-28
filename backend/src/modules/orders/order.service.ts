import { prisma } from "../../config/prisma";
import { OrderStatus, PaymentMethod, PaymentStatus, ReturnStatus, Prisma } from "@prisma/client";
import { env } from "../../config/env";
import { razorpayService, paymentService } from "../payments";
import { notificationService } from "../notifications/notification.service";
import { pdfService, OrderDocumentData } from "../../services/pdf.service";
import {

  CreateOrderDto,
  CreateOrderResult,
  VerifyPaymentDto,
  PaymentFailedDto,
  UpdateOrderStatusDto,
  CreateReturnRequestDto,
  UpdateReturnStatusDto,
  ReturnFilterParams,
  ReturnRequestResponse,
  ReturnListResponse,
  OrderFilterParams,
  OrderResponse,
  OrderListResponse,
  OrderStatsResponse,
} from "./order.types";

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING_FEE = 49;
const RETURN_WINDOW_DAYS = 7;

export class OrderService {
  /**
   * Helper: Format return request for clean API response
   */
  private formatReturnRequest(ret: any): ReturnRequestResponse {
    return {
      id: ret.id,
      orderId: ret.orderId,
      userId: ret.userId,
      reason: ret.reason,
      details: ret.details || null,
      status: ret.status,
      adminComment: ret.adminComment || null,
      refundAmount: ret.refundAmount,
      refundedAt: ret.refundedAt || null,
      pickedUpAt: ret.pickedUpAt || null,
      receivedAt: ret.receivedAt || null,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt,
      order: ret.order ? this.formatOrder(ret.order) : undefined,
      user: ret.user
        ? {
            id: ret.user.id,
            name: ret.user.name,
            email: ret.user.email,
          }
        : undefined,
    };
  }

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
      returnRequest: order.returnRequest ? this.formatReturnRequest(order.returnRequest) : null,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        variantId: item.variantId || null,
        variantAttributes: item.variantAttributes || null,
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
   * 1. Create a new Order from User's active Cart
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<CreateOrderResult> {
    // 1. Fetch user and active cart with variant relations
    const [user, cart] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
              variant: true,
            },
          },
        },
      }),
    ]);

    if (!user) {
      throw new Error("User account not found.");
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error("Your cart is empty. Please add items before placing an order.");
    }

    // 2. Validate product & variant stock and availability
    let subtotal = 0;
    const orderItemsData: {
      productId: string;
      variantId?: string | null;
      variantAttributes?: any;
      name: string;
      image: string | null;
      price: number;
      quantity: number;
      totalPrice: number;
    }[] = [];

    for (const item of cart.items) {
      const product = item.product;
      const variant = item.variant;

      if (!product) {
        throw new Error("One or more products in your cart are no longer available.");
      }

      const effectiveStock = variant ? variant.stock : product.stock;
      const effectiveActive = variant
        ? variant.isActive && product.isActive
        : product.isActive;
      const effectivePrice = variant ? variant.price : product.price;
      const effectiveImage = variant
        ? variant.thumbnail || variant.images?.[0] || product.thumbnail || product.images?.[0] || null
        : product.thumbnail || product.images?.[0] || null;

      const itemName = variant && variant.attributes && Object.keys(variant.attributes as object).length > 0
        ? `${product.name} (${Object.entries(variant.attributes as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(", ")})`
        : product.name;

      if (!effectiveActive) {
        throw new Error(`Item "${itemName}" is no longer active for ordering.`);
      }

      if (effectiveStock <= 0) {
        throw new Error(`Item "${itemName}" is out of stock.`);
      }

      if (item.quantity > effectiveStock) {
        throw new Error(
          `Cannot place order. Requested ${item.quantity} units of "${itemName}", but only ${effectiveStock} are available.`
        );
      }

      const itemTotal = Math.round(effectivePrice * item.quantity * 100) / 100;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        variantAttributes: variant ? (variant.attributes as any) : null,
        name: itemName,
        image: effectiveImage,
        price: effectivePrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;

    // 3. Discount calculation from promo coupon
    let discount = 0;
    const coupon = (dto.couponCode || "").trim().toUpperCase();
    if (coupon) {
      if (coupon === "SAVE10" || coupon === "WELCOME10") {
        discount = Math.round(((subtotal * 10) / 100) * 100) / 100;
      } else if (coupon === "SUPER20" || coupon === "FESTIVE20") {
        discount = Math.round(((subtotal * 20) / 100) * 100) / 100;
      } else if (coupon === "VIP30") {
        discount = Math.round(((subtotal * 30) / 100) * 100) / 100;
      }
    }

    // 4. Shipping fee calculation (Free above ₹499)
    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
    const shippingFee = isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const tax = 0;
    const grandTotal = Math.max(0, Math.round((subtotal - discount + shippingFee + tax) * 100) / 100);

    // 5. Generate human-friendly order number
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${timestamp}-${randomSuffix}`;

    const isOnlinePayment = dto.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY;

    // 6. Execute atomic transaction in PostgreSQL
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Create Order record
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: OrderStatus.PENDING,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          subtotal,
          discount,
          couponCode: coupon || null,
          shippingFee,
          tax,
          grandTotal,
          shippingAddress: dto.shippingAddress as any,
          billingAddress: (dto.billingAddress || dto.shippingAddress) as any,
          notes: dto.notes ? dto.notes.trim() : null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          user: true,
          returnRequest: true,
        },
      });

      // Atomically decrement inventory for each product and variant
      for (const item of orderItemsData) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Empty user's cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Save Address to user's address book if requested
      if (dto.saveAddress) {
        await tx.address.create({
          data: {
            userId,
            fullName: dto.shippingAddress.fullName,
            phone: dto.shippingAddress.phone,
            streetAddress: dto.shippingAddress.streetAddress,
            city: dto.shippingAddress.city,
            state: dto.shippingAddress.state,
            postalCode: dto.shippingAddress.postalCode,
            country: dto.shippingAddress.country || "India",
            isDefault: true,
          },
        });
      }

      return order;
    });

    // 7. Trigger in-app notification & SMTP email for customer order placement
    notificationService.notifyOrderPlaced(createdOrder).catch((err) => {
      console.warn("[OrderService] notifyOrderPlaced failed:", err);
    });

    // 8. Check low-stock threshold for every item ordered
    for (const item of orderItemsData) {
      notificationService.checkAndNotifyLowStock(item.productId, item.variantId).catch((err) => {
        console.warn("[OrderService] checkAndNotifyLowStock failed:", err);
      });
    }

    // 9. If Online Payment, generate Razorpay Order
    if (isOnlinePayment) {
      try {
        const razorpayOrder = await razorpayService.createOrder({
          amount: grandTotal,
          receipt: orderNumber,
          notes: {
            orderId: createdOrder.id,
            userId,
            orderNumber,
          },
        });

        // Store Razorpay order ID in DB
        const updatedOrder = await prisma.order.update({
          where: { id: createdOrder.id },
          data: {
            razorpayOrderId: razorpayOrder.id,
          },
          include: {
            items: true,
            user: true,
            returnRequest: true,
          },
        });

        return {
          order: this.formatOrder(updatedOrder),
          razorpay: {
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount, // in paise
            currency: razorpayOrder.currency,
            keyId: env.razorpayKeyId,
            orderNumber: orderNumber,
            prefill: {
              name: dto.shippingAddress.fullName || user.name,
              email: user.email,
              contact: dto.shippingAddress.phone,
            },
          },
        };
      } catch (razorpayError: any) {
        console.error("Razorpay order creation fallback:", razorpayError);
        return {
          order: this.formatOrder(createdOrder),
        };
      }
    }

    return {
      order: this.formatOrder(createdOrder),
    };
  }

  /**
   * 2. Get customer's orders history
   */
  async getMyOrders(userId: string, params?: OrderFilterParams): Promise<OrderListResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      userId,
    };

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as OrderStatus;
    }

    if (params?.search && params.search.trim()) {
      where.orderNumber = {
        contains: params.search.trim(),
        mode: "insensitive",
      };
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          returnRequest: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 3. Get single order details for customer
   */
  async getMyOrderById(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        returnRequest: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found in your order history.");
    }

    return this.formatOrder(order);
  }

  /**
   * 4. Cancel order by customer (Allowed only if PENDING or PROCESSING)
   */
  async cancelMyOrder(userId: string, orderId: string, reason: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, returnRequest: true },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found.");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("Order has already been cancelled.");
    }

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      throw new Error(
        `Cannot cancel order once it is ${order.status.toLowerCase()}. Please contact customer support or request a return.`
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // 1. Update order status
      const cancelled = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: reason.trim(),
        },
        include: { items: true, returnRequest: true },
      });

      // 2. Restore inventory stock for each item and variant
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      return cancelled;
    });

    notificationService.notifyOrderCancelled(updatedOrder, reason).catch((err) => {
      console.warn("[OrderService] notifyOrderCancelled failed:", err);
    });

    return this.formatOrder(updatedOrder);
  }

  /**
   * 5. Customer: Request product return within 7 days of delivery
   */
  async requestOrderReturn(
    userId: string,
    orderId: string,
    dto: CreateReturnRequestDto
  ): Promise<ReturnRequestResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        returnRequest: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new Error("Order not found in your account.");
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new Error("Returns can only be requested for orders that have been successfully delivered.");
    }

    // Determine delivery and return window timestamps
    const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt;
    const returnUntil =
      order.returnUntil || new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const now = new Date();
    if (now.getTime() > returnUntil.getTime()) {
      throw new Error(
        `The 7-day return window for this order has expired on ${returnUntil.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}.`
      );
    }

    // Check if an active return request already exists
    if (order.returnRequest && order.returnRequest.status !== ReturnStatus.REJECTED) {
      throw new Error(
        `A return request with status "${order.returnRequest.status}" is already active for this order.`
      );
    }

    // Create or update return request record
    const returnRequest = await prisma.returnRequest.upsert({
      where: { orderId },
      create: {
        orderId,
        userId,
        reason: dto.reason.trim(),
        details: dto.details ? dto.details.trim() : null,
        status: ReturnStatus.REQUESTED,
        refundAmount: order.grandTotal,
      },
      update: {
        reason: dto.reason.trim(),
        details: dto.details ? dto.details.trim() : null,
        status: ReturnStatus.REQUESTED,
        adminComment: null,
        refundAmount: order.grandTotal,
        pickedUpAt: null,
        receivedAt: null,
        refundedAt: null,
      },
      include: {
        order: {
          include: { items: true },
        },
        user: true,
      },
    });

    notificationService.notifyReturnRequested(returnRequest, order).catch((err) => {
      console.warn("[OrderService] notifyReturnRequested failed:", err);
    });

    return this.formatReturnRequest(returnRequest);
  }

  /**
   * 6. Customer: Get all return requests for customer
   */
  async getMyReturns(userId: string, params?: ReturnFilterParams): Promise<ReturnListResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReturnRequestWhereInput = {
      userId,
    };

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as ReturnStatus;
    }

    if (params?.search && params.search.trim()) {
      where.order = {
        orderNumber: {
          contains: params.search.trim(),
          mode: "insensitive",
        },
      };
    }

    const [total, returns] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: { items: true },
          },
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      returns: returns.map((r) => this.formatReturnRequest(r)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 7. Customer: Get single order return details
   */
  async getMyOrderReturn(userId: string, orderId: string): Promise<ReturnRequestResponse> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { orderId },
      include: {
        order: {
          include: { items: true },
        },
        user: true,
      },
    });

    if (!returnRequest || returnRequest.userId !== userId) {
      throw new Error("No return request found for this order.");
    }

    return this.formatReturnRequest(returnRequest);
  }

  /**
   * 8. Admin: Get all orders (Scoped for Vendor or Super Admin)
   */
  async getAllOrdersAdmin(
    params?: OrderFilterParams,
    caller?: { id: string; role: string }
  ): Promise<OrderListResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (caller && caller.role === "VENDOR") {
      where.items = {
        some: {
          product: {
            vendorId: caller.id,
          },
        },
      };
    }

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as OrderStatus;
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.trim();
      const searchConditions: Prisma.OrderWhereInput[] = [
        { orderNumber: { contains: term, mode: "insensitive" as const } },
        { user: { name: { contains: term, mode: "insensitive" as const } } },
        { user: { email: { contains: term, mode: "insensitive" as const } } },
      ];
      if (where.items) {
        where.AND = [
          { items: where.items },
          { OR: searchConditions },
        ];
        delete where.items;
      } else {
        where.OR = searchConditions;
      }
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  vendorId: true,
                },
              },
            },
          },
          user: true,
          returnRequest: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders: orders.map((o) => this.formatOrder(o)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 9. Admin: Get single order details with ownership check
   */
  async getOrderByIdAdmin(
    orderId: string,
    caller?: { id: string; role: string }
  ): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                vendorId: true,
              },
            },
          },
        },
        user: true,
        returnRequest: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    if (caller && caller.role === "VENDOR") {
      const hasVendorItem = order.items.some(
        (item) => (item as any).product?.vendorId === caller.id
      );
      if (!hasVendorItem) {
        throw new Error("Forbidden. You do not have access to this order.");
      }
    }

    return this.formatOrder(order);
  }

  /**
   * 10. Admin: Update order status (Calculates deliveredAt and 7-day returnUntil on DELIVERED)
   */
  async updateOrderStatusAdmin(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, returnRequest: true },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    const isBeingCancelled =
      dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED;

    const isBeingDelivered =
      dto.status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED;

    const deliveredAt = isBeingDelivered
      ? (order.deliveredAt || new Date())
      : order.deliveredAt;

    const returnUntil = isBeingDelivered
      ? (order.returnUntil || new Date((deliveredAt || new Date()).getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000))
      : order.returnUntil;

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: dto.status,
          paymentStatus: dto.paymentStatus || order.paymentStatus,
          notes: dto.notes !== undefined ? dto.notes : order.notes,
          cancelledAt: isBeingCancelled ? new Date() : order.cancelledAt,
          cancelReason: isBeingCancelled ? dto.notes || "Cancelled by administrator" : order.cancelReason,
          deliveredAt,
          returnUntil,
        },
        include: {
          items: true,
          user: true,
          returnRequest: true,
        },
      });

      // If newly cancelled by admin, restore inventory
      if (isBeingCancelled) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      return updated;
    });

    // Trigger appropriate customer notification on status change
    if (dto.status === OrderStatus.SHIPPED && order.status !== OrderStatus.SHIPPED) {
      notificationService.notifyOrderShipped(updatedOrder).catch((err) => {
        console.warn("[OrderService] notifyOrderShipped failed:", err);
      });
    } else if (dto.status === OrderStatus.DELIVERED && order.status !== OrderStatus.DELIVERED) {
      notificationService.notifyOrderDelivered(updatedOrder).catch((err) => {
        console.warn("[OrderService] notifyOrderDelivered failed:", err);
      });
    } else if (dto.status === OrderStatus.PROCESSING && order.status !== OrderStatus.PROCESSING) {
      notificationService.notifyOrderConfirmed(updatedOrder).catch((err) => {
        console.warn("[OrderService] notifyOrderConfirmed failed:", err);
      });
    } else if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.CANCELLED) {
      notificationService.notifyOrderCancelled(updatedOrder, dto.notes || "Cancelled by administrator").catch((err) => {
        console.warn("[OrderService] notifyOrderCancelled failed:", err);
      });
    }

    return this.formatOrder(updatedOrder);
  }

  /**
   * 11. Admin: Get all return requests with filters
   */
  async getAllReturnsAdmin(params?: ReturnFilterParams): Promise<ReturnListResponse> {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.ReturnRequestWhereInput = {};

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as ReturnStatus;
    }

    if (params?.search && params.search.trim()) {
      const term = params.search.trim();
      where.OR = [
        { reason: { contains: term, mode: "insensitive" } },
        { order: { orderNumber: { contains: term, mode: "insensitive" } } },
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
      ];
    }

    const [total, returns] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: { items: true },
          },
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      returns: returns.map((r) => this.formatReturnRequest(r)),
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * 12. Admin: Get return request by ID
   */
  async getReturnByIdAdmin(returnId: string): Promise<ReturnRequestResponse> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: { items: true },
        },
        user: true,
      },
    });

    if (!returnRequest) {
      throw new Error("Return request not found.");
    }

    return this.formatReturnRequest(returnRequest);
  }

  /**
   * 13. Admin: Update return request status with validation & automatic refund/restock
   */
  async updateReturnStatusAdmin(
    returnId: string,
    dto: UpdateReturnStatusDto
  ): Promise<ReturnRequestResponse> {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: { items: true },
        },
        user: true,
      },
    });

    if (!returnRequest) {
      throw new Error("Return request not found.");
    }

    const currentStatus = returnRequest.status;
    const targetStatus = dto.status;

    // Validate state transitions
    const allowedTransitions: Record<ReturnStatus, ReturnStatus[]> = {
      REQUESTED: [ReturnStatus.APPROVED, ReturnStatus.REJECTED],
      APPROVED: [ReturnStatus.PICKED_UP, ReturnStatus.REJECTED],
      PICKED_UP: [ReturnStatus.RECEIVED],
      RECEIVED: [ReturnStatus.REFUNDED],
      REJECTED: [ReturnStatus.REQUESTED], // Can be re-opened if requested
      REFUNDED: [],
    };

    if (currentStatus !== targetStatus && !allowedTransitions[currentStatus]?.includes(targetStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${targetStatus}". Allowed next states: ${
          allowedTransitions[currentStatus]?.join(", ") || "None (Terminal state)"
        }.`
      );
    }

    const data: Prisma.ReturnRequestUpdateInput = {
      status: targetStatus,
      adminComment: dto.adminComment !== undefined ? dto.adminComment.trim() : returnRequest.adminComment,
    };

    if (targetStatus === ReturnStatus.PICKED_UP && !returnRequest.pickedUpAt) {
      data.pickedUpAt = new Date();
    }
    if (targetStatus === ReturnStatus.RECEIVED && !returnRequest.receivedAt) {
      data.receivedAt = new Date();
    }
    if (targetStatus === ReturnStatus.REFUNDED && !returnRequest.refundedAt) {
      data.refundedAt = new Date();
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ret = await tx.returnRequest.update({
        where: { id: returnId },
        data,
        include: {
          order: {
            include: { items: true },
          },
          user: true,
        },
      });

      // When transitioning to REFUNDED:
      if (targetStatus === ReturnStatus.REFUNDED && currentStatus !== ReturnStatus.REFUNDED) {
        // 1. Update order payment status to REFUNDED
        await tx.order.update({
          where: { id: returnRequest.orderId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
          },
        });

        // 2. Restock returned items to product and variant inventory
        for (const item of returnRequest.order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            });
          }
        }
      }

      return ret;
    });

    if (targetStatus === ReturnStatus.REFUNDED && currentStatus !== ReturnStatus.REFUNDED) {
      notificationService.notifyOrderRefunded(returnRequest.order, updated).catch((err) => {
        console.warn("[OrderService] notifyOrderRefunded failed:", err);
      });
    }

    return this.formatReturnRequest(updated);
  }

  /**
   * 14. Admin: Get order statistics (Scoped for Vendor or Super Admin)
   */
  async getOrderStatsAdmin(caller?: { id: string; role: string }): Promise<OrderStatsResponse> {
    if (caller && caller.role === "VENDOR") {
      const vendorId = caller.id;
      const orderItems = await prisma.orderItem.findMany({
        where: {
          product: {
            vendorId,
          },
        },
        include: {
          order: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      const uniqueOrdersByStatus: Record<string, Set<string>> = {
        ALL: new Set(),
        PENDING: new Set(),
        PROCESSING: new Set(),
        SHIPPED: new Set(),
        DELIVERED: new Set(),
        CANCELLED: new Set(),
      };

      let totalRevenue = 0;
      for (const item of orderItems) {
        if (item.order) {
          uniqueOrdersByStatus.ALL.add(item.order.id);
          if (uniqueOrdersByStatus[item.order.status]) {
            uniqueOrdersByStatus[item.order.status].add(item.order.id);
          }
          if (item.order.status !== OrderStatus.CANCELLED) {
            totalRevenue += item.totalPrice || 0;
          }
        }
      }

      return {
        totalOrders: uniqueOrdersByStatus.ALL.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        pendingOrders: uniqueOrdersByStatus.PENDING.size,
        processingOrders: uniqueOrdersByStatus.PROCESSING.size,
        shippedOrders: uniqueOrdersByStatus.SHIPPED.size,
        deliveredOrders: uniqueOrdersByStatus.DELIVERED.size,
        cancelledOrders: uniqueOrdersByStatus.CANCELLED.size,
      };
    }

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
      prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: {
          grandTotal: true,
        },
      }),
    ]);

    const totalRevenue = Math.round((revenueResult._sum.grandTotal || 0) * 100) / 100;

    return {
      totalOrders,
      totalRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
    };
  }

  /**
   * 15. Get user's saved addresses
   */
  async getUserAddresses(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * 16. Verify Razorpay Payment Signature
   */
  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<OrderResponse> {
    return paymentService.verifyPayment(userId, dto);
  }

  /**
   * 17. Record Payment Failure
   */
  async handlePaymentFailed(userId: string, dto: PaymentFailedDto): Promise<OrderResponse> {
    return paymentService.handlePaymentFailed(userId, dto);
  }

  /**
   * 18. Retry Payment for Pending or Failed Order
   */
  async retryPayment(userId: string, orderId: string): Promise<CreateOrderResult> {
    return paymentService.retryPayment(userId, orderId);
  }

  /**
   * 19. Webhook handler for async payment verification from Razorpay
   */
  async handleWebhook(
    rawBody: string,
    signature: string,
    payload: any
  ): Promise<{ success: boolean; message: string }> {
    return paymentService.handleWebhook(rawBody, signature, payload);
  }

  /**
   * 20. Generate and export Order PDF / Tax Invoice PDF Buffer
   */
  async generateOrderDocument(
    orderId: string,
    userId?: string,
    caller?: { id: string; role: string },
    type: "order" | "invoice" = "order"
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                vendorId: true,
              },
            },
            variant: {
              select: {
                id: true,
                sku: true,
                attributes: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            businessName: true,
          },
        },
        returnRequest: true,
      },
    });

    if (!order) {
      throw new Error("Order not found.");
    }

    // Customer access check
    if (userId && !caller) {
      if (order.userId !== userId) {
        throw new Error("Forbidden. You do not have access to this order document.");
      }
    }

    // Admin/Vendor access check
    if (caller) {
      if (caller.role === "VENDOR") {
        const hasVendorItem = order.items.some(
          (item) => (item as any).product?.vendorId === caller.id
        );
        if (!hasVendorItem) {
          throw new Error("Forbidden. You do not have access to this order document.");
        }
      } else if (caller.role !== "SUPER_ADMIN") {
        if (order.userId !== caller.id) {
          throw new Error("Forbidden. You do not have access to this order document.");
        }
      }
    }

    const orderData: OrderDocumentData = {
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
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId: order.razorpayPaymentId,
      cancelledAt: order.cancelledAt,
      cancelReason: order.cancelReason,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        variantAttributes: item.variantAttributes as Record<string, string> | null,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        variant: item.variant
          ? {
              sku: item.variant.sku,
              attributes: item.variant.attributes as Record<string, string> | null,
            }
          : null,
      })),
      user: order.user,
    };

    let buffer: Buffer;
    let filename: string;

    if (type === "invoice") {
      buffer = await pdfService.generateInvoicePdf(orderData);
      filename = `Invoice-${order.orderNumber}.pdf`;
    } else {
      buffer = await pdfService.generateOrderPdf(orderData);
      filename = `Order-${order.orderNumber}.pdf`;
    }

    return {
      buffer,
      filename,
      contentType: "application/pdf",
    };
  }
}

export default new OrderService();

