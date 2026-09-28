export const ROUTES = {
  // Storefront Public Routes
  HOME: "/",
  CATEGORIES: "/categories",
  CATEGORY_BY_SLUG: (slug: string) => `/categories/${encodeURIComponent(slug)}`,
  PRODUCTS: "/products",
  PRODUCT_BY_SLUG: (slug: string) => `/products/${encodeURIComponent(slug)}`,
  DEALS: "/deals",
  CART: "/cart",

  // Customer Protected Routes
  DASHBOARD: "/dashboard",
  WISHLIST: "/wishlist",
  HIGHLY_INTERESTED: "/customer/highly-interested",
  NOTIFICATIONS: "/notifications",
  CHECKOUT: "/checkout",
  CHECKOUT_SUCCESS: (id: string) => `/checkout/success/${id}`,
  ORDERS: "/orders",
  ORDER_DETAIL: (id: string) => `/orders/${id}`,


  // Auth Routes
  LOGIN: "/login",
  REGISTER: "/register",
  VENDOR_REGISTER: "/vendor/register",

  // Vendor Portal Routes
  VENDOR: {
    ROOT: "/vendor",
    DASHBOARD: "/vendor",
    PRODUCTS: "/vendor/products",
    CATEGORIES: "/vendor/categories",
    ORDERS: "/vendor/orders",
    REVIEWS: "/vendor/reviews",
    VISITS: "/vendor/visits",
    NOTIFICATIONS: "/vendor/notifications",
  },

  // Admin Routes
  ADMIN: {
    ROOT: "/admin",
    CATEGORIES: "/admin/categories",
    PRODUCTS: "/admin/products",
    VISITS: "/admin/visits",
    ORDERS: "/admin/orders",
    USERS: "/admin/users",
    VENDORS: "/admin/vendors",
    BANNERS: "/admin/banners",
    REVIEWS: "/admin/reviews",
  },
};

