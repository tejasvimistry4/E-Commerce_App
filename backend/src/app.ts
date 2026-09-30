import express from "express";
import cors from "cors";
import path from "path";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./modules/auth/auth.routes";
import categoryRoutes from "./modules/categories/category.routes";
import productRoutes from "./modules/products/product.routes";
import cartRoutes from "./modules/cart/cart.routes";
import orderRoutes from "./modules/orders/order.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import uploadRoutes from "./modules/upload/upload.routes";
import bannerRoutes from "./modules/banners/banner.routes";
import reviewRoutes from "./modules/reviews/review.routes";
import wishlistRoutes from "./modules/wishlist/wishlist.routes";
import visitRoutes from "./modules/visits/visit.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import { swaggerSpec } from "./docs/swagger";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman) or any localhost port during development
      if (!origin || /^http:\/\/localhost:\d+$/.test(origin) || origin === "http://127.0.0.1:3000") {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API is running",
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/notifications", notificationRoutes);


// Global Error Handler
app.use(errorHandler);

export default app;