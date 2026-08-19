# Ryanz Clothes — Dynamic Firestore E-Commerce Platform

A modern streetwear e-commerce platform built with React, Tailwind CSS, and Firebase.

Adheres strictly to the **Firestore-First Architecture** where **ZERO store data is hardcoded**. All products, categories, orders, users, and customer reviews are dynamically synchronized in real-time with Google Cloud Firestore and Firebase Storage.

---

## Architecture

```
                       Firebase Cloud
            ┌─────────────────┼─────────────────┐
            │                 │                 │
     Firebase Auth     Cloud Firestore    Firebase Storage
      (Users/RBAC)       (Store DB)       (Product Images)
            │                 │                 │
            ▼                 ▼                 ▼
   ┌─────────────────────────────────────────────────────┐
   │                  Ryanz Clothes                      │
   │                                                     │
   │   ┌──────────────────────┐  ┌────────────────────┐  │
   │   │   Admin Dashboard    │  │ Customer Front     │  │
   │   │   (/admin/*)         │  │ (/, /shop, /cart)  │  │
   │   │                      │  │                    │  │
   │   │ • Product CRUD       │  │ • Live Shop Feed   │  │
   │   │ • Category CRUD      │  │ • Dynamic Home     │  │
   │   │ • Order Status       │  │ • Product Details  │  │
   │   │ • User Management    │  │ • Verified Cart    │  │
   │   │ • Review Moderation  │  │ • Immutable Orders │  │
   │   │ • 1-Click DB Seeder  │  │ • User Profile     │  │
   │   └──────────────────────┘  └────────────────────┘  │
   └─────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Dynamic Firestore Catalog**:
   - Zero hardcoded product or category arrays.
   - Real-time updates via Firestore `onSnapshot()` — admin changes instantly reflect in customer view without page refresh.

2. **Admin Dashboard (`/admin`)**:
   - **Products**: Add, Edit, Delete, Stock management, Price & Discount, Size picker, Color palette, Firebase Storage image uploads, Featured & New Arrival toggles, Active/Disabled switches.
   - **Categories**: Dynamic category management with custom slugs and cover images.
   - **Orders**: Live incoming order feed, purchased item snapshots, customer shipping details, status updater (`pending` → `processing` → `shipped` → `delivered` → `cancelled`).
   - **Customers**: Registered users directory and role promotions (`customer` ↔ `admin`).
   - **Reviews**: Moderation and deletion of customer ratings.
   - **1-Click Seeder**: Instant Firestore population tool to inject the complete initial Ryanz Clothes apparel catalog.

3. **Customer Storefront**:
   - **Home (`/`)**: Dynamic hero, dynamic category grid, Firestore-queried Featured Products (`featured == true`), New Arrivals (`createdAt`), and Sale drops (`discountPrice > 0`).
   - **Shop (`/shop`)**: Dynamic categories filter, price range slider, multi-size filter, stock filter, sorting (Price, Rating, Newest).
   - **Product Details (`/product/:id`)**: Multi-image thumbnail gallery, size & color selectors, live stock counters, dynamic review submission & ratings.
   - **Shopping Bag (`/cart`)**: Live subtotal calculations, free shipping threshold meter.
   - **Checkout (`/checkout`)**: Pre-checkout live Firestore price & availability verification, immutable order snapshot creation in `orders/{orderId}`.
   - **User Profile (`/profile`) & Orders (`/my-orders`)**: Profile sync with `users/{userId}` and real-time order tracking.

---

## Firebase Configuration

1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database**, **Authentication** (Email/Password & Google), and **Storage**.
3. Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## Firestore Data Collections

| Collection | Description | Key Fields |
|---|---|---|
| `products` | Dynamic product documents | `name`, `description`, `price`, `discountPrice`, `category`, `sizes`, `colors`, `stock`, `images`, `featured`, `isNewArrival`, `isActive`, `rating`, `numReviews` |
| `categories` | Dynamic categories | `name`, `slug`, `description`, `image`, `isActive` |
| `orders` | Immutable purchase snapshots | `userId`, `customerName`, `customerEmail`, `shippingAddress`, `items` (snapshot of name, price, qty, size, color, image), `subtotal`, `shippingFee`, `totalAmount`, `status`, `paymentMethod` |
| `users` | User profile & role sync | `name`, `email`, `phone`, `role`, `shippingAddress` |
| `reviews` | Customer product reviews | `productId`, `productName`, `userId`, `userName`, `rating`, `comment`, `createdAt` |
