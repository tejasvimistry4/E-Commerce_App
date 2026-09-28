import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, AdminRoute, VendorRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { UserLayout } from "../components/layout/UserLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { VendorLayout } from "../components/layout/VendorLayout";
import { CartDrawer } from "../components/cart/CartDrawer";
import { ROUTES } from "../config/routes";

// Storefront & Customer Pages
import Home from "../pages/Home/Home";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import CategoriesPage from "../pages/Categories/CategoriesPage";
import ProductsPage from "../pages/Products/ProductsPage";
import ProductDetailPage from "../pages/Products/ProductDetailPage";
import DealsPage from "../pages/Deals/DealsPage";
import CartPage from "../pages/Cart/CartPage";
import CheckoutPage from "../pages/Checkout/CheckoutPage";
import OrderSuccessPage from "../pages/Checkout/OrderSuccessPage";
import OrdersPage from "../pages/Customer/OrdersPage";
import OrderDetailPage from "../pages/Customer/OrderDetailPage";
import CustomerDashboard from "../pages/Customer/CustomerDashboard";
import WishlistPage from "../pages/Customer/WishlistPage";
import HighlyInterestedPage from "../pages/Customer/HighlyInterestedPage";
import NotificationsPage from "../pages/Customer/NotificationsPage";

// Vendor Pages
import { VendorRegisterPage } from "../pages/Vendor/VendorRegisterPage";
import { VendorDashboard } from "../pages/Vendor/VendorDashboard";
import { VendorProductsPage } from "../pages/Vendor/VendorProductsPage";
import { VendorCategoriesPage } from "../pages/Vendor/VendorCategoriesPage";
import { VendorOrdersPage } from "../pages/Vendor/VendorOrdersPage";
import { VendorReviewsPage } from "../pages/Vendor/VendorReviewsPage";
import { VendorVisitsPage } from "../pages/Vendor/VendorVisitsPage";
import { VendorNotificationsPage } from "../pages/Vendor/VendorNotificationsPage";

// Admin Pages
import { AdminDashboard } from "../pages/Admin/AdminDashboard";
import { AdminCategoriesPage } from "../pages/Admin/AdminCategoriesPage";
import { AdminProductsPage } from "../pages/Admin/AdminProductsPage";
import { AdminVisitsPage } from "../pages/Admin/AdminVisitsPage";
import { AdminOrdersPage } from "../pages/Admin/AdminOrdersPage";
import { AdminUsersPage } from "../pages/Admin/AdminUsersPage";
import { AdminVendorsPage } from "../pages/Admin/AdminVendorsPage";
import { AdminBannersPage } from "../pages/Admin/AdminBannersPage";
import { AdminReviewsPage } from "../pages/Admin/AdminReviewsPage";

export const AppRoutes: React.FC = () => {
  return (
    <>
      {/* Global Slide-over Cart Drawer */}
      <CartDrawer />

      <Routes>
        {/* Customer Storefront Routes wrapped in UserLayout (Navbar + Main Outlet + Footer) */}
        <Route element={<UserLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
          <Route path="/categories/:slug" element={<ProductsPage />} />
          <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path={ROUTES.DEALS} element={<DealsPage />} />
          <Route path={ROUTES.CART} element={<CartPage />} />

          {/* Protected Customer Routes */}
          <Route
            path={ROUTES.CHECKOUT}
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout/success/:id"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.ORDERS}
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.WISHLIST}
            element={
              <ProtectedRoute>
                <WishlistPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.HIGHLY_INTERESTED}
            element={
              <ProtectedRoute>
                <HighlyInterestedPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path={ROUTES.LOGIN}
            element={
              <PublicRoute restricted={true}>
                <Login />
              </PublicRoute>
            }
          />

          <Route
            path={ROUTES.REGISTER}
            element={
              <PublicRoute restricted={true}>
                <Register />
              </PublicRoute>
            }
          />

          {/* Public Vendor Registration Route */}
          <Route
            path={ROUTES.VENDOR_REGISTER}
            element={
              <PublicRoute restricted={false}>
                <VendorRegisterPage />
              </PublicRoute>
            }
          />
        </Route>

        {/* Vendor Portal Protected Routes with VendorLayout */}
        <Route
          path={ROUTES.VENDOR.ROOT}
          element={
            <VendorRoute>
              <VendorLayout />
            </VendorRoute>
          }
        >
          <Route index element={<VendorDashboard />} />
          <Route path="products" element={<VendorProductsPage />} />
          <Route path="categories" element={<VendorCategoriesPage />} />
          <Route path="orders" element={<VendorOrdersPage />} />
          <Route path="reviews" element={<VendorReviewsPage />} />
          <Route path="visits" element={<VendorVisitsPage />} />
          <Route path="notifications" element={<VendorNotificationsPage />} />
        </Route>

        {/* Admin Dashboard Protected Routes with AdminLayout */}
        <Route
          path={ROUTES.ADMIN.ROOT}
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="visits" element={<AdminVisitsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="vendors" element={<AdminVendorsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;