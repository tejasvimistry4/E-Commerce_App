# Multi-Vendor E-Commerce Platform

A modern, full-stack e-commerce web application built with **React 19**, **TypeScript**, **Node.js / Express 5**, **Prisma ORM**, **PostgreSQL**, **Redis**, and **Tailwind CSS**. The platform features Role-Based Access Control (**Customer**, **Vendor**, and **Super Admin**), an **AI-powered Visual Image Search** engine, dynamic search facets with typo correction, real-time notifications, a 7-day return request workflow, automated PDF invoices and packing slips, Razorpay payment gateway integration, multi-language internationalization (English, French, Hindi), and responsive promotional banner management.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
  - [Customer Experience (Storefront)](#customer-experience-storefront)
  - [Vendor Portal](#vendor-portal)
  - [Super Admin Portal](#super-admin-portal)
  - [AI Visual Search & Intelligent Discovery](#ai-visual-search--intelligent-discovery)
  - [Orders, Payments & Returns](#orders-payments--returns)
  - [Transactional Email & PDF Invoicing](#transactional-email--pdf-invoicing)
  - [Internationalization (i18n)](#internationalization-i18n)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Schema (Prisma)](#database-schema-prisma)
- [API Documentation & Endpoints](#api-documentation--endpoints)
  - [Authentication & Vendor Management](#authentication--vendor-management)
  - [Categories](#categories)
  - [Products, Variants & Visual Search](#products-variants--visual-search)
  - [Cart & Checkout](#cart--checkout)
  - [Orders, Invoices & Returns](#orders-invoices--returns)
  - [Payments (Razorpay)](#payments-razorpay)
  - [Reviews & Ratings](#reviews--ratings)
  - [Wishlist](#wishlist)
  - [Product Visits & Lead Analytics](#product-visits--lead-analytics)
  - [Promotional Banners](#promotional-banners)
  - [Notifications](#notifications)
  - [File Uploads](#file-uploads)
- [Environment Variables](#environment-variables)
  - [Backend Configuration (`backend/.env`)](#backend-configuration-backendenv)
  - [Frontend Configuration (`frontend/.env`)](#frontend-configuration-frontendenv)
- [Installation & Setup Guide](#installation--setup-guide)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Running the Application](#3-running-the-application)
- [Seed Data & Default Credentials](#seed-data--default-credentials)
- [Scripts Reference](#scripts-reference)

---

## Overview & Architecture

The application is architected as a decoupled client-server system:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       React 19 Single Page App                          │
│   (TypeScript, Redux Toolkit, Tailwind CSS, i18next, React Router v7)   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST & Multi-part FormData
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Express 5 Backend API                            │
│           (TypeScript, tsx, JWT Auth, Google OAuth, Multer)             │
├────────────────────────────────────┼────────────────────────────────────┤
│           Core Services            │         External Integrations      │
│  • Visual Search (CLIP ViT / ONNX) │  • Razorpay Payment Gateway        │
│  • Redis Caching & Search Engine   │  • Google OAuth 2.0                │
│  • PDFKit Invoice / Receipt Engine │  • SMTP Mail Server (Nodemailer)   │
│  • Notification Dispatcher         │  • Swagger OpenAPI 3.0 Specs       │
└──────────────────┬─────────────────┴────────────────────────────────────┘
                   │ Prisma ORM 6
                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   PostgreSQL Relational Database                        │
│ (Users, Vendors, Categories, Products, Variants, Orders, Returns, etc.) │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### Customer Experience (Storefront)
- **Product Discovery & Catalog**: Browse products by category hierarchy, price range, stock availability, ratings, and discounts.
- **Product Variants**: Multi-variant selector (Colors, Sizes, Materials, custom attributes) with dynamic pricing, SKU, and image updates.
- **Product Image Zoom**: High-resolution interactive image magnifying glass.
- **Shopping Cart**: Real-time cart drawer and dedicated cart page with quantity updates, live financial summaries (subtotal, discounts, shipping, tax), and guest-to-account cart merging upon login.
- **Customer Account Portal**: Profile management, order tracking with real-time status badges, detailed order receipts, return requests, and address book.
- **Wishlist**: Add/remove products with instant cross-page synchronization.
- **Customer Reviews**: Submit star ratings (1–5), review titles, detailed feedback, and upload proof images with verified purchase detection.
- **Engagement History**: Track recently visited products and automatically discover a personalized "Highly Interested" showcase (triggered after 3+ visits).
- **Notifications Inbox**: Bell icon with live unread badge, category filter, mark-as-read, and clear-all actions.

### Vendor Portal
- **Vendor Registration**: Public onboarding flow for prospective merchants submitting business details (store name, phone, address, description).
- **Vendor Dashboard**: Visual analytics, revenue metrics, order volume, catalog inventory count, and visitor engagement tracking.
- **Product & Variant Management**: Full CRUD for vendor-owned products and variants, including image galleries and inventory thresholds.
- **Category Management**: Create and manage vendor-scoped categories.
- **Order Processing**: View customer orders containing vendor products, track line items, and inspect fulfillment details.
- **Customer Engagement & Leads**: View which products are driving the most user visits and identifying high-intent shoppers.
- **Low-Stock Notifications**: Automated in-app alerts and transactional emails when product stock dips below defined thresholds.

### Super Admin Portal
- **Global Overview Dashboard**: Platform revenue, total orders, active customer counts, vendor performance charts, and top-selling products.
- **Vendor Moderation**: Review pending vendor applications, approve or reject applications with admin feedback, or deactivate existing vendor accounts.
- **Catalog Management**: Admin-wide product and category CRUD with nested subcategory hierarchy support.
- **Order & Returns Moderation**: Inspect all global orders, update delivery statuses (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), and process return/refund requests.
- **Review Moderation**: Approve or reject customer product reviews before public listing.
- **Banner Campaigns**: Create, schedule, and prioritize promotional banners (Festival, Seasonal, Sale, Promotional, General) with date ranges and custom styling.
- **User Management**: View all registered customer and vendor profiles.
- **AI Embeddings Sync**: Run batch vectorization across the entire catalog for Visual Search.

### AI Visual Search & Intelligent Discovery
- **Visual Image Search**: Upload any product image (camera/file) to find visually similar items across the catalog. Utilizes **CLIP Vision Transformer** (`Xenova/clip-vit-base-patch32`) embeddings (512-dimensional vectors) stored in PostgreSQL with cosine similarity ranking and spatial fallback descriptors.
- **Faceted Search**: Dynamic sidebar facets aggregating categories, brands, price ranges, ratings, discount buckets, and variant attributes.
- **Live Search Autocomplete**: Instant debounced query suggestions covering matching products, categories, brands, and popular keywords.
- **Typo Tolerance & "Did You Mean?"**: Levenshtein distance matching against dynamic catalog vocabulary extracted from PostgreSQL and Redis.
- **Search Analytics**: Trending search term tracking backed by Redis sorted sets (`ZINCRBY`) with frequency thresholding and authenticated user search history management.

### Orders, Payments & Returns
- **Flexible Checkout**: Multi-step checkout supporting saved delivery addresses and multiple payment methods (**Cash on Delivery** and **Razorpay**).
- **Razorpay Integration**: Server-order generation, client-side modal checkout, cryptographic HMAC SHA256 signature verification, failure tracking, payment retry flows, and automated webhook listeners.
- **7-Day Return Policy**: Customers can request item returns within 7 days of delivery with reason selection and custom notes.
- **Return Lifecycle**: `REQUESTED` $\rightarrow$ `APPROVED` / `REJECTED` $\rightarrow$ `PICKED_UP` $\rightarrow$ `RECEIVED` $\rightarrow$ `REFUNDED`.

### Transactional Email & PDF Invoicing
- **Nodemailer HTML Emails**: Responsive, branded email templates with inline CID image attachments dispatched for:
  - Order Placed
  - Order Confirmed & Processing
  - Order Shipped
  - Order Delivered
  - Order Cancelled
  - Order Refunded
  - Vendor Low-Stock Alert
- **PDFKit Document Generation**:
  - **Order Receipt / Packing Slip**: Order summary, items table, delivery address, payment method, and financial breakdown.
  - **Official Tax Invoice**: Commercial GST invoice formatted with invoice numbers, company details, line item tax breakdowns, and payment status.

### Internationalization (i18n)
- Seamless multilingual experience powered by `i18next` and `react-i18next`.
- Supported languages:
  - 🇺🇸 **English** (`en`)
  - 🇫🇷 **French** (`fr`)
  - 🇮🇳 **Hindi** (`hi`)

---

## Technology Stack

### Backend
| Layer | Technology | Description |
|---|---|---|
| **Runtime & Framework** | Node.js, Express `v5.2.1` | REST API Server with async middleware |
| **Language & Tooling** | TypeScript `v7.0.2`, `tsx v4.23.12` | Type-safe development with live reload |
| **Database & ORM** | PostgreSQL, Prisma ORM `v6.19.3` | Relational schema, migrations, connection pooling |
| **Caching & Search** | Redis, `ioredis v6.0.0` | In-memory query caching & search analytics |
| **Authentication** | `jsonwebtoken v9.0.3`, `bcryptjs v3.0.3` | Stateless JWT tokens and salted password hashing |
| **OAuth** | `google-auth-library v11.0.2` | Google OAuth 2.0 ID Token verification |
| **Payments** | `razorpay v2.9.8` | Payment orders, signature verification, webhooks |
| **AI / Embeddings** | `@xenova/transformers v2.17.2` | CLIP ViT image feature extraction |
| **Image Processing** | `jpeg-js`, `pngjs` | In-memory image decoding for feature extraction |
| **File Handling** | `multer v2.2.0` | Multi-part form data uploads for product media |
| **Emails** | `nodemailer v10.0.10` | SMTP transactional email transport with CID attachments |
| **PDF Generation** | `pdfkit v0.20.2` | Dynamic invoices and packing slips |
| **Validation** | `express-validator v7.3.2` | Strict request schema & parameter validation |
| **API Documentation** | `swagger-ui-express v5.0.1`, `swagger-jsdoc v6.3.0` | OpenAPI 3.0 specification & interactive UI |

### Frontend
| Layer | Technology | Description |
|---|---|---|
| **Core Framework** | React `v19.2.8`, `react-dom v19.2.8` | Component-based UI library |
| **Language** | TypeScript `v5.9.3` | Static type checking |
| **Build & Bundler** | Webpack `v5.109.2`, Webpack Dev Server `v6.0.0` | Custom compilation pipeline with TS-Loader |
| **Styling** | Tailwind CSS `v4.3.3`, PostCSS `v8.5.26` | Modern utility-first stylesheet |
| **State Management** | Redux Toolkit `v2.12.0`, `react-redux v9.3.0` | Centralized slices for auth, products, cart, etc. |
| **Routing** | React Router DOM `v7.18.2` | Nested layouts, public, customer, vendor & admin routes |
| **HTTP Client** | Axios `v1.19.0` | Centralized API client with JWT bearer interceptors |
| **Internationalization** | `i18next v26.4.2`, `react-i18next v17.0.13` | Multilingual client (EN, FR, HI) |
| **Data Visualization** | Recharts `v3.10.1` | Analytics charts for vendor & admin dashboards |
| **UI Components & Icons** | React Icons `v5.7.0`, React Toastify `v11.1.0` | Accessible iconography and toast notifications |
| **Image Zoom** | `react-image-magnify v2.7.4` | Storefront product detail magnifier |

---

## Project Structure

```
e-commerce/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Comprehensive Prisma schema (17 models)
│   │   └── seed.ts                    # Super Admin database seeder
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                 # Validated environment configuration
│   │   │   ├── prisma.ts              # Global Prisma Client instance
│   │   │   └── redis.ts               # Redis client with in-memory fallback
│   │   ├── docs/
│   │   │   └── swagger.ts             # OpenAPI 3.0 configuration & schemas
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT authentication & role authorization
│   │   │   ├── error.middleware.ts    # Global centralized error handler
│   │   │   ├── upload.middleware.ts   # Multer file upload handlers (single/multi)
│   │   │   └── validate.middleware.ts # express-validator validation runner
│   │   ├── modules/
│   │   │   ├── auth/                  # Register, login, Google OAuth, vendor approval
│   │   │   ├── banners/               # Promotional homepage banner management
│   │   │   ├── cart/                  # Shopping cart operations & guest sync
│   │   │   ├── categories/            # Hierarchical category catalog & tree
│   │   │   ├── notifications/         # In-app notifications & unread counts
│   │   │   ├── orders/                # Checkout, order tracking, returns & PDF downloads
│   │   │   ├── payments/              # Razorpay verification, failure & retry flows
│   │   │   ├── products/              # Products, variants, search & visual search
│   │   │   ├── reviews/               # Customer ratings, images & admin moderation
│   │   │   ├── upload/                # Static asset upload endpoints
│   │   │   ├── visits/                # Behavior tracking & high-interest analytics
│   │   │   └── wishlist/              # Customer wishlist management
│   │   ├── scripts/                   # Integration and test scripts
│   │   ├── services/
│   │   │   ├── cache.service.ts       # Unified Redis & memory cache engine
│   │   │   ├── email.service.ts       # Nodemailer order lifecycle email dispatcher
│   │   │   └── pdf.service.ts         # PDF generation service wrapper
│   │   ├── templates/
│   │   │   ├── emailTemplates.ts      # HTML email layouts with CID attachment support
│   │   │   └── pdf/                   # PDFKit receipt & GST invoice document layouts
│   │   ├── utils/
│   │   │   ├── googleAuth.ts          # Google token verification utility
│   │   │   ├── jwt.ts                 # JWT signing & verification helpers
│   │   │   └── password.ts            # bcrypt password hashing & comparison
│   │   ├── app.ts                     # Express application definition & route mounting
│   │   └── server.ts                  # Server entrypoint with DB connect & CLIP sync
│   ├── uploads/                       # Local storage directory for uploaded media
│   ├── .env.example                   # Backend environment template
│   ├── package.json                   # Backend dependencies and scripts
│   └── tsconfig.json                  # TypeScript compiler configuration
│
└── frontend/
    ├── public/
    │   └── index.html                 # HTML template with Google Sign-In & Razorpay scripts
    ├── src/
    │   ├── api/
    │   │   ├── axios.ts               # Axios instance setup
    │   │   ├── endpoints.ts           # Centralized API endpoint registry
    │   │   ├── interceptor.ts         # Request token & response error interceptors
    │   │   └── *.api.ts               # Modular API functions (auth, products, orders, etc.)
    │   ├── components/
    │   │   ├── admin/                 # Admin specific modals and tables
    │   │   ├── auth/                  # Auth forms, Google Sign-In button
    │   │   ├── banners/               # Hero banner carousel & slider
    │   │   ├── cart/                  # Slide-over cart drawer & cart item cards
    │   │   ├── categories/            # Category chips & tree cards
    │   │   ├── common/                # Buttons, loaders, badges, confirmation modals
    │   │   ├── layout/                # UserLayout, VendorLayout, AdminLayout, Navbar, Footer
    │   │   ├── products/              # ProductCard, filters, image zoom, visual search modal
    │   │   ├── reviews/               # Review lists, star rating breakdown, review modal
    │   │   └── visits/                # Visit tracking cards & engagement metrics
    │   ├── config/
    │   │   └── routes.ts              # Centralized route constants
    │   ├── i18n/
    │   │   ├── LanguageSelector.tsx   # Language switch dropdown component
    │   │   ├── config.ts              # i18next configuration
    │   │   └── locales/               # Translations: en.json, fr.json, hi.json
    │   ├── pages/
    │   │   ├── Admin/                 # Admin Dashboard, Categories, Products, Orders, etc.
    │   │   ├── Cart/                  # Shopping Cart page
    │   │   ├── Categories/            # Browse categories page
    │   │   ├── Checkout/              # Checkout page & Order Success receipt page
    │   │   ├── Customer/              # Customer Orders, Order Detail, Wishlist, Highly Interested
    │   │   ├── Deals/                 # Promotional discounted deals showcase
    │   │   ├── Home/                  # Storefront home page with banners & categories
    │   │   ├── Login/                 # Sign In page (Standard & Google)
    │   │   ├── Products/              # Products catalog with faceted filter & Product Detail
    │   │   ├── Register/              # Customer registration page
    │   │   └── Vendor/                # Vendor Register, Dashboard, Products, Orders, Visits
    │   ├── redux/
    │   │   ├── store.ts               # Redux store configuration
    │   │   └── */*Slice.ts            # Slices: auth, products, search, cart, orders, etc.
    │   ├── routes/
    │   │   ├── AppRoutes.tsx          # Full client-side routing definitions
    │   │   ├── ProtectedRoute.tsx     # Role guard wrappers (User, Vendor, Admin)
    │   │   └── PublicRoute.tsx        # Guest route redirect wrappers
    │   ├── services/                  # Application business services
    │   ├── types/                     # TypeScript shared interfaces & types
    │   ├── utils/                     # Formatters, currency helpers, and storage utilities
    │   ├── App.tsx                    # Root App component
    │   ├── index.css                  # Global styles & Tailwind CSS imports
    │   └── main.tsx                   # React root render
    ├── .env.example                   # Frontend environment template
    ├── package.json                   # Frontend dependencies and scripts
    ├── postcss.config.js              # PostCSS configuration for Tailwind CSS v4
    ├── tsconfig.json                  # Frontend TypeScript compiler configuration
    └── webpack.config.js              # Webpack build & dev-server configuration
```

---

## Database Schema (Prisma)

The application utilizes a PostgreSQL schema defined in `backend/prisma/schema.prisma`:

| Model | Description |
|---|---|
| **User** | Customers, Vendors, and Super Admins. Stores auth credentials, Google OAuth ID, avatar, vendor business details, and approval status. |
| **Category** | Self-referencing hierarchical categories (`parentId` $\rightarrow$ `children`) with slug, image, active status, and vendor association. |
| **Product** | Core catalog items linked to Category and Vendor. Includes pricing, comparePrice, stock, SKU, images, featured flag, and low stock threshold. |
| **ProductVariant** | SKU-level product variants (Colors, Sizes, Materials, custom JSON attributes) with variant-specific pricing, stock, and images. |
| **Cart & CartItem** | User shopping cart containing references to products, optional variants, and quantities. |
| **Address** | User address book for checkout shipping and billing information. |
| **Order & OrderItem** | Order master record with financial breakdown (subtotal, discount, shipping, tax, grand total), addresses, payment details, tracking, and cancellation info. Items snapshot product names, pricing, and variant attributes. |
| **ReturnRequest** | 7-day post-delivery product return requests with reason, status workflow, admin feedback, and refund amounts. |
| **Banner** | Homepage promotional banners with scheduling windows (`startDate`/`endDate`), types, gradients, badges, and priority. |
| **Review** | Customer ratings (1–5), review titles, comments, images, verified purchase flags, and admin moderation statuses (`PENDING`, `APPROVED`, `REJECTED`). |
| **WishlistItem** | Customer wishlist entries linked to products and variants. |
| **ProductEmbedding** | 512-dimension vector embeddings generated from product images for AI Visual Search. |
| **ProductVisit** | User product engagement logs with visit timestamps, visit counts, and an automatic `isHighlyInterested` flag (3+ visits). |
| **Notification** | In-app alerts for order lifecycle updates, low-stock warnings, and system announcements. |
| **SearchHistory** | Authenticated customer search history queries. |

---

## API Documentation & Endpoints

Interactive Swagger UI documentation is available at:
```
http://localhost:5000/api-docs
```

### Authentication & Vendor Management
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new customer account |
| `POST` | `/api/auth/vendor/register` | Public | Register a new vendor account (Status: `PENDING`) |
| `POST` | `/api/auth/login` | Public | Log in with email & password (returns JWT) |
| `POST` | `/api/auth/google` | Public | Sign in / sign up with Google OAuth ID token |
| `GET` | `/api/auth/me` | Authenticated | Get current authenticated user profile |
| `GET` | `/api/auth/users` | Super Admin | List all registered users |
| `GET` | `/api/auth/admin/vendors` | Super Admin | List all vendors with approval status and metrics |
| `GET` | `/api/auth/admin/vendors/:id` | Super Admin | Get details of a specific vendor |
| `PATCH`| `/api/auth/admin/vendors/:id/status` | Super Admin | Approve, reject, or deactivate a vendor |
| `GET` | `/api/auth/vendor/stats` | Vendor / Admin | Get vendor dashboard metrics and analytics |

### Categories
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | Get all active top-level categories |
| `GET` | `/api/categories/tree` | Public | Get complete hierarchical category tree |
| `GET` | `/api/categories/admin/all` | Vendor / Admin | List all categories (including inactive) |
| `GET` | `/api/categories/slug/:slug` | Public | Get category details by URL slug |
| `GET` | `/api/categories/:id` | Public | Get category by UUID |
| `POST` | `/api/categories` | Vendor / Admin | Create a new category or subcategory |
| `PUT` | `/api/categories/:id` | Vendor / Admin | Update an existing category |
| `PATCH`| `/api/categories/:id/status` | Vendor / Admin | Toggle active/inactive visibility status |
| `DELETE`|`/api/categories/:id` | Vendor / Admin | Delete a category |

### Products, Variants & Visual Search
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | Paginated product list with search, facets, & sorting |
| `GET` | `/api/products/featured` | Public | Get featured products showcase |
| `POST` | `/api/products/visual-search` | Public | Search products by uploading an image (Multipart) |
| `GET` | `/api/products/search/facets` | Public | Dynamic search aggregation facets |
| `GET` | `/api/products/search/suggestions`| Public | Debounced live search autocomplete & keyword suggestions |
| `GET` | `/api/products/search/popular` | Public | Trending & popular search queries |
| `POST` | `/api/products/search/track` | Public | Record search query analytics |
| `GET` | `/api/products/search/history` | Authenticated | Get user search history |
| `POST` | `/api/products/search/history` | Authenticated | Add query to user search history |
| `DELETE`|`/api/products/search/history` | Authenticated | Remove query from user search history |
| `DELETE`|`/api/products/search/history/clear`| Authenticated | Clear all user search history |
| `GET` | `/api/products/admin/all` | Vendor / Admin | List all products with admin metrics |
| `POST` | `/api/products/admin/sync-embeddings`| Super Admin | Batch sync AI image embeddings across catalog |
| `GET` | `/api/products/slug/:slug` | Public | Get product details by slug with related items |
| `GET` | `/api/products/:id` | Public | Get product details by UUID |
| `POST` | `/api/products` | Vendor / Admin | Create a new product |
| `PUT` | `/api/products/:id` | Vendor / Admin | Update product details |
| `PATCH`| `/api/products/:id/status` | Vendor / Admin | Toggle product active status |
| `DELETE`|`/api/products/:id` | Vendor / Admin | Delete a product |
| `GET` | `/api/products/:productId/variants` | Public | Get all variants for a product |
| `POST` | `/api/products/:productId/variants` | Vendor / Admin | Create a product variant |
| `PUT` | `/api/products/variants/:variantId` | Vendor / Admin | Update a product variant |
| `DELETE`|`/api/products/variants/:variantId` | Vendor / Admin | Delete a product variant |

### Cart & Checkout
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/cart` | Authenticated | Get user cart with calculated totals |
| `POST` | `/api/cart/items` | Authenticated | Add product or variant to cart |
| `PUT` | `/api/cart/items/:id` | Authenticated | Update cart item quantity |
| `DELETE`|`/api/cart/items/:id` | Authenticated | Remove item from cart |
| `DELETE`|`/api/cart/clear` | Authenticated | Clear all items in cart |
| `POST` | `/api/cart/sync` | Authenticated | Merge guest cart items into database cart |

### Orders, Invoices & Returns
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders/checkout` | Authenticated | Create order from cart (COD or Razorpay) |
| `POST` | `/api/orders/verify-payment` | Authenticated | Verify Razorpay payment signature & confirm order |
| `POST` | `/api/orders/payment-failed` | Authenticated | Record client-side payment failure |
| `POST` | `/api/orders/my-orders/:id/retry-payment` | Authenticated | Retry payment for pending/failed order |
| `GET` | `/api/orders/addresses` | Authenticated | Get saved user delivery addresses |
| `GET` | `/api/orders/my-orders` | Authenticated | Get customer order history |
| `GET` | `/api/orders/my-orders/:id` | Authenticated | Get single customer order details |
| `GET` | `/api/orders/my-orders/:id/pdf` | Authenticated | Download customer Order Receipt PDF |
| `GET` | `/api/orders/my-orders/:id/invoice` | Authenticated | Download customer Tax Invoice PDF |
| `POST` | `/api/orders/my-orders/:id/cancel` | Authenticated | Cancel order (if eligible) |
| `POST` | `/api/orders/my-orders/:id/return` | Authenticated | Submit return request within 7 days |
| `GET` | `/api/orders/my-orders/:id/return` | Authenticated | Get return request status for order |
| `GET` | `/api/orders/my-returns` | Authenticated | Get customer return requests list |
| `GET` | `/api/orders/admin/stats` | Vendor / Admin | Get order KPI metrics & revenue stats |
| `GET` | `/api/orders/admin/all` | Vendor / Admin | List all orders with filters & pagination |
| `GET` | `/api/orders/admin/:id` | Vendor / Admin | Get single order details for admin/vendor |
| `GET` | `/api/orders/admin/:id/pdf` | Vendor / Admin | Download admin Order Receipt PDF |
| `GET` | `/api/orders/admin/:id/invoice` | Vendor / Admin | Download admin Tax Invoice PDF |
| `PATCH`| `/api/orders/admin/:id/status` | Super Admin | Update order status (`PROCESSING`, `SHIPPED`, etc.) |
| `GET` | `/api/orders/admin/returns` | Super Admin | List all return requests |
| `GET` | `/api/orders/admin/returns/:id` | Super Admin | Get single return request detail |
| `PATCH`| `/api/orders/admin/returns/:id/status`| Super Admin | Approve, reject, or refund a return request |
| `POST` | `/api/orders/webhook` | Public | Asynchronous Razorpay webhook receiver |

### Payments (Razorpay)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/payments/verify` | Authenticated | Verify Razorpay payment signature |
| `POST` | `/api/payments/failed` | Authenticated | Record payment failure |
| `POST` | `/api/payments/retry/:id` | Authenticated | Generate new Razorpay order for retry |
| `POST` | `/api/payments/webhook` | Public | Razorpay webhook signature verification |

### Reviews & Ratings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/reviews/product/:productId` | Public | Get approved reviews & rating breakdown |
| `GET` | `/api/reviews/product/:productId/my-review`| Authenticated | Get user's existing review for product |
| `POST` | `/api/reviews/product/:productId` | Authenticated | Submit a product review (with images) |
| `PUT` | `/api/reviews/:id` | Authenticated | Update existing user review |
| `DELETE`|`/api/reviews/:id` | Authenticated | Delete user review |
| `GET` | `/api/reviews/top-products` | Public | Get products ranked by total review counts |
| `GET` | `/api/reviews/admin/stats` | Vendor / Admin | Review moderation statistics |
| `GET` | `/api/reviews/admin/all` | Vendor / Admin | List all reviews for moderation |
| `GET` | `/api/reviews/admin/top-products` | Vendor / Admin | Top reviewed products |
| `PATCH`| `/api/reviews/admin/:id/status` | Super Admin | Approve or reject customer review |
| `DELETE`|`/api/reviews/admin/:id` | Super Admin | Permanently delete review |

### Wishlist
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/wishlist` | Authenticated | Get user wishlist items |
| `POST` | `/api/wishlist/toggle` | Authenticated | Toggle product in wishlist (add/remove) |
| `POST` | `/api/wishlist/items` | Authenticated | Add product to wishlist |
| `DELETE`|`/api/wishlist/items/:productId`| Authenticated | Remove product from wishlist |
| `DELETE`|`/api/wishlist/clear` | Authenticated | Clear all wishlist items |

### Product Visits & Lead Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/visits/track` | Authenticated | Record product visit for user |
| `GET` | `/api/visits/status/:productId` | Authenticated | Get visit count & highly interested status |
| `GET` | `/api/visits/highly-interested` | Authenticated | Get user's highly interested products (3+ visits) |
| `GET` | `/api/visits/recent` | Authenticated | Get user's recently visited products |
| `GET` | `/api/visits/admin/all` | Vendor / Admin | List all user visit engagement records |
| `GET` | `/api/visits/admin/ranked-products`| Vendor / Admin | Products ranked by total visits & unique visitors |

### Promotional Banners
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/banners/active` | Public | Get currently active & scheduled banners |
| `GET` | `/api/banners/admin/all` | Super Admin | List all banners with admin filters |
| `GET` | `/api/banners/:id` | Super Admin | Get single banner details |
| `POST` | `/api/banners` | Super Admin | Create a new promotional banner |
| `PUT` | `/api/banners/:id` | Super Admin | Update an existing banner |
| `PATCH`| `/api/banners/:id/status` | Super Admin | Toggle banner active status |
| `DELETE`|`/api/banners/:id` | Super Admin | Delete a banner |

### Notifications
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Get paginated user notifications |
| `GET` | `/api/notifications/unread-count`| Authenticated | Get total unread notifications count |
| `PATCH`| `/api/notifications/mark-all-read`| Authenticated | Mark all notifications as read |
| `PATCH`| `/api/notifications/:id/read` | Authenticated | Mark single notification as read |
| `DELETE`|`/api/notifications` | Authenticated | Clear all notifications |
| `DELETE`|`/api/notifications/:id` | Authenticated | Delete single notification |

### File Uploads
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/upload/single` | Authenticated | Upload a single image (Max: 10MB) |
| `POST` | `/api/upload/multiple` | Authenticated | Upload up to 10 images (Max: 10MB each) |

---

## Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory:

```env
# Server Port & Environment
PORT=5000
NODE_ENV=development

# PostgreSQL Connection String (Prisma)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ecommerce_db?schema=public"

# JWT Secret & Token Lifecycle
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Google OAuth 2.0 Client ID (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"

# Razorpay Payment Gateway Keys (from Razorpay Dashboard)
RAZORPAY_KEY_ID="rzp_test_yourKeyId"
RAZORPAY_KEY_SECRET="yourRazorpayKeySecret"
RAZORPAY_WEBHOOK_SECRET="yourRazorpayWebhookSecret"

# Application URLs
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:5000"

# Optional Redis URL (defaults to redis://127.0.0.1:6379 with in-memory fallback)
REDIS_URL="redis://127.0.0.1:6379"

# SMTP Mail Server Configuration (Gmail / Brevo / Custom SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-smtp-email@gmail.com"
SMTP_PASS="your-smtp-app-password"
SMTP_FROM="E-Commerce Store <no-reply@yourdomain.com>"
```

### Frontend Configuration (`frontend/.env`)

Create a `.env` file in the `frontend/` directory:

```env
# Backend API Base URL
REACT_APP_API_URL=http://localhost:5000/api

# Google OAuth 2.0 Client ID
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com

# Razorpay Public Key ID
REACT_APP_RAZORPAY_KEY_ID=rzp_test_yourKeyId
```

---

## Installation & Setup Guide

### Prerequisites
- **Node.js**: `v18.x` or later
- **npm**: `v9.x` or later
- **PostgreSQL**: `v14.x` or later (running locally or via Docker)
- **Redis** *(Optional)*: `v6.x` or later (an automatic in-memory cache fallback is included if Redis is not running)

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```
   *(Update your PostgreSQL database credentials, JWT secret, and API keys)*

4. Push the Prisma schema to create the PostgreSQL database and tables:
   ```bash
   npx prisma db push
   ```

5. Generate the Prisma Client:
   ```bash
   npx prisma generate
   ```

6. Seed the initial Super Admin account:
   ```bash
   npm run seed
   ```

---

### 2. Frontend Setup

1. Open a second terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Create the `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
   *(Ensure `REACT_APP_API_URL` points to `http://localhost:5000/api`)*

---

### 3. Running the Application

#### Start Backend Server
From the `backend/` directory:
```bash
npm run dev
```
- API Server runs at: `http://localhost:5000`
- Swagger UI available at: `http://localhost:5000/api-docs`

#### Start Frontend Application
From the `frontend/` directory:
```bash
npm run dev
```
- Storefront runs at: `http://localhost:3000`

---

## Seed Data & Default Credentials

After running `npm run seed` in the backend, the following default Super Admin account is available:

| Role | Email | Password |
|---|---|---|
| **SUPER_ADMIN** | `admin@gmail.com` | `Admin@123` |

> [!NOTE]
> - New customer accounts can be registered directly at `http://localhost:3000/register`.
> - Vendors can register at `http://localhost:3000/vendor/register` and must be approved by the Super Admin in the Admin Portal (`/admin/vendors`) before accessing the Vendor Portal.

---

## Scripts Reference

### Backend (`backend/package.json`)
- `npm run dev`: Starts the backend in development mode using `tsx watch src/server.ts`.
- `npm run build`: Compiles TypeScript files into the `dist/` directory using `tsc`.
- `npm run start`: Runs the compiled production server (`node dist/server.js`).
- `npm run seed`: Seeds the database with the default Super Admin user (`tsx prisma/seed.ts`).
- `npx prisma studio`: Launches the visual Prisma Studio database GUI at `http://localhost:5555`.

### Frontend (`frontend/package.json`)
- `npm run dev`: Starts the Webpack Dev Server on port 3000 with Hot Module Replacement.
- `npm run build`: Bundles the production build to `dist/`.
- `npm run type-check`: Runs TypeScript compiler diagnostics without emitting files (`tsc --noEmit`).
