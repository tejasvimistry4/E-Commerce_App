import { prisma } from "../../config/prisma";
import {
  AddToCartDto,
  UpdateCartItemDto,
  SyncCartDto,
  FullCartResponse,
  CartItemSummary,
  CartCalculationSummary,
} from "./cart.types";

const FREE_SHIPPING_THRESHOLD = 499;
const STANDARD_SHIPPING_FEE = 49;

export class CartService {
  /**
   * Helper: Calculate cart financials and summary
   */
  private calculateSummary(items: CartItemSummary[]): CartCalculationSummary {
    let subtotal = 0;
    let savings = 0;
    let totalQuantity = 0;

    for (const item of items) {
      if (!item.isOutOfStock) {
        subtotal += item.totalPrice;
        totalQuantity += item.quantity;

        const comparePrice = item.variant
          ? item.variant.comparePrice
          : item.product.comparePrice;

        if (comparePrice && comparePrice > item.price) {
          savings += (comparePrice - item.price) * item.quantity;
        }
      }
    }

    const isFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0;
    const shippingFee = subtotal === 0 ? 0 : isFreeShipping ? 0 : STANDARD_SHIPPING_FEE;
    const amountNeededForFreeShipping = Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - subtotal
    );
    const estimatedTax = 0; // Inclusive of GST
    const grandTotal = subtotal + shippingFee + estimatedTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      shippingFee,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      amountNeededForFreeShipping: Math.round(amountNeededForFreeShipping * 100) / 100,
      isFreeShipping,
      estimatedTax,
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalItems: items.length,
      totalQuantity,
    };
  }

  /**
   * Helper: Format raw database cart to rich response
   */
  private formatCart(rawCart: any): FullCartResponse {
    const items: CartItemSummary[] = (rawCart.items || []).map((item: any) => {
      const product = item.product;
      const variant = item.variant;

      const effectiveStock = variant ? variant.stock : product.stock;
      const effectiveActive = variant
        ? variant.isActive && product.isActive
        : product.isActive;

      const isOutOfStock = !effectiveActive || effectiveStock <= 0;
      const effectivePrice = variant ? variant.price : product.price;
      const totalPrice = effectivePrice * item.quantity;

      const thumbnail = variant
        ? variant.thumbnail || variant.images?.[0] || product.thumbnail || product.images?.[0] || null
        : product.thumbnail || product.images?.[0] || null;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId || null,
        variant: variant
          ? {
              id: variant.id,
              sku: variant.sku,
              price: variant.price,
              comparePrice: variant.comparePrice,
              stock: variant.stock,
              images: variant.images || [],
              thumbnail: variant.thumbnail || variant.images?.[0] || null,
              attributes: (variant.attributes as Record<string, string>) || {},
              isActive: variant.isActive,
            }
          : null,
        quantity: item.quantity,
        price: effectivePrice,
        totalPrice: Math.round(totalPrice * 100) / 100,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          comparePrice: product.comparePrice,
          stock: product.stock,
          thumbnail,
          images: product.images || [],
          isActive: product.isActive,
          category: product.category
            ? {
                id: product.category.id,
                name: product.category.name,
                slug: product.category.slug,
              }
            : undefined,
        },
        isOutOfStock,
        maxAvailableQuantity: Math.max(0, effectiveStock),
      };
    });

    const summary = this.calculateSummary(items);

    return {
      id: rawCart.id,
      userId: rawCart.userId,
      items,
      summary,
      createdAt: rawCart.createdAt,
      updatedAt: rawCart.updatedAt,
    };
  }

  /**
   * 1. Get or create user's cart
   */
  async getCart(userId: string): Promise<FullCartResponse> {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              include: {
                category: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: {
                    select: { id: true, name: true, slug: true },
                  },
                },
              },
              variant: true,
            },
          },
        },
      });
    }

    return this.formatCart(cart);
  }

  /**
   * 2. Add product / variant to user's cart
   */
  async addToCart(userId: string, dto: AddToCartDto): Promise<FullCartResponse> {
    const product = await prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product) {
      throw new Error(`Product with ID "${dto.productId}" not found.`);
    }

    if (!product.isActive) {
      throw new Error(`Product "${product.name}" is currently not available for purchase.`);
    }

    let variant = null;
    if (dto.variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });

      if (!variant || variant.productId !== dto.productId) {
        throw new Error("Selected product variant does not exist or does not match this product.");
      }

      if (!variant.isActive) {
        throw new Error("Selected product variant is currently unavailable.");
      }
    }

    const availableStock = variant ? variant.stock : product.stock;
    const itemName = variant ? `${product.name} (Variant)` : product.name;

    if (availableStock <= 0) {
      throw new Error(`"${itemName}" is currently out of stock.`);
    }

    const requestedQty = Math.max(1, dto.quantity || 1);

    // Get or create user's cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if matching item already exists in cart (matching cartId, productId, variantId)
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ? dto.variantId : null,
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + requestedQty;
      if (newQuantity > availableStock) {
        throw new Error(
          `Cannot add more. You have ${existingItem.quantity} in cart and only ${availableStock} are in stock.`
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      if (requestedQty > availableStock) {
        throw new Error(
          `Cannot add ${requestedQty} units. Only ${availableStock} are available in stock.`
        );
      }

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId ? dto.variantId : null,
          quantity: requestedQty,
        },
      });
    }

    return this.getCart(userId);
  }

  /**
   * 3. Update cart item quantity
   */
  async updateCartItemQuantity(
    userId: string,
    cartItemId: string,
    quantity: number
  ): Promise<FullCartResponse> {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new Error("Cart item not found in your cart.");
    }

    // If quantity is 0 or less, remove item
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: cartItemId },
      });
      return this.getCart(userId);
    }

    // Check stock limit
    const availableStock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;
    if (quantity > availableStock) {
      throw new Error(
        `Requested quantity (${quantity}) exceeds available stock (${availableStock}).`
      );
    }

    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  /**
   * 4. Remove item from cart
   */
  async removeFromCart(userId: string, cartItemId: string): Promise<FullCartResponse> {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      throw new Error("Cart item not found in your cart.");
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return this.getCart(userId);
  }

  /**
   * 5. Clear all items in user's cart
   */
  async clearCart(userId: string): Promise<FullCartResponse> {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return this.getCart(userId);
  }

  /**
   * 6. Sync / Merge guest cart items into user's database cart safely
   */
  async syncGuestCart(userId: string, dto: SyncCartDto): Promise<FullCartResponse> {
    if (!dto.items || !Array.isArray(dto.items) || dto.items.length === 0) {
      return this.getCart(userId);
    }

    // Aggregate duplicates within the incoming guest cart list (key: productId_variantId)
    const aggregatedGuestItems = new Map<string, { productId: string; variantId?: string | null; quantity: number }>();
    for (const item of dto.items) {
      if (item && item.productId && item.quantity > 0) {
        const key = `${item.productId}_${item.variantId || ""}`;
        const existing = aggregatedGuestItems.get(key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          aggregatedGuestItems.set(key, {
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          });
        }
      }
    }

    if (aggregatedGuestItems.size === 0) {
      return this.getCart(userId);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    for (const itemData of aggregatedGuestItems.values()) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: itemData.productId },
        });

        if (!product || !product.isActive) {
          continue;
        }

        let variant = null;
        if (itemData.variantId) {
          variant = await prisma.productVariant.findUnique({
            where: { id: itemData.variantId },
          });
          if (!variant || !variant.isActive || variant.productId !== product.id) {
            continue;
          }
        }

        const availableStock = variant ? variant.stock : product.stock;
        if (availableStock <= 0) {
          continue;
        }

        const validGuestQty = Math.max(1, Math.min(availableStock, itemData.quantity));

        const existing = await prisma.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: itemData.productId,
            variantId: itemData.variantId ? itemData.variantId : null,
          },
        });

        if (existing) {
          const mergedQty = Math.min(availableStock, existing.quantity + validGuestQty);
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: mergedQty },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: itemData.productId,
              variantId: itemData.variantId ? itemData.variantId : null,
              quantity: validGuestQty,
            },
          });
        }
      } catch (err) {
        // Continue merging other valid items
      }
    }

    return this.getCart(userId);
  }
}

export default new CartService();
