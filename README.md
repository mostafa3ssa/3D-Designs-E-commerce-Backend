# 3D Printing E-commerce Backend (NOT COMPLETED)

This is the backend API for the 3D Printing E-commerce application. It is built using the MERN stack (MongoDB, Express, React, Node.js) and provides a comprehensive set of endpoints for user authentication, product management, and custom design uploads.

## Key Features

- **Authentication**: Secure user registration, login, and password management with JWT and email verification.
- **Product Management**: Admin tools for managing pre-designed 3D models, including image and STL file handling.
- **Custom Designs**: Users can upload their own STL files for instant price estimation based on volume and material costs.
- **Storage Integration**: Seamless integration with Cloudinary for images and Cloudflare R2 for large STL files.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Storage**: Cloudinary, Cloudflare R2
- **Authentication**: JWT, bcryptjs

---

# Auth API — /api/auth

This document describes the authentication-related HTTP endpoints implemented in `backend/routes/auth.routes.js`.

Base path: `/api/auth`

Environment variables (used by the auth flow)

- `JWT_SECRET` — secret used to sign JWTs
- `JWT_EXPIRES_IN` — JWT expiration (e.g. `1d`, `7d`)
- `SALT_ROUNDS` — bcrypt salt rounds (integer)
- `FRONTEND_URL` — frontend base URL used in verification/reset links
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` — SMTP settings used by email sender

Common notes

- Requests with JSON bodies require the `Content-Type: application/json` header.
- The app uses a token blacklist model for logout — `POST /logout` requires an Authorization header with a Bearer token and will blacklist the token.
- Verification and reset links are sent by email and include a short-lived token (the email helper mentions a 10 minute expiration for the links).
- The routes use validation middlewares: `validateRegistration` and `validateLogin` where applicable.

Endpoints

- **POST** `/register`

  - Purpose: Create a new user account and send an email verification link.
  - Middlewares: `validateRegistration` (input validation)
  - Body (JSON):
    - `firstName` (string, required)
    - `lastName` (string, required)
    - `email` (string, required)
    - `password` (string, required)
  - Responses:

    - `201` — User created. Body: `{ message: "User registered successfully", userId }`
    - `200` — If an existing user with the same email exists but is NOT verified, a new verification email is sent and the route responds with a success-like message: `{ message: "An unverified user with this email already exists. A new verification email has been sent." }`
    - `400` — Missing fields or email already registered for a verified account: `{ message: "Email already registered" }` or validation error
    - `500` — Server error

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/auth/register" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Jane","lastName":"Doe","email":"jane@example.com","password":"s3cureP@ss"}'
    ```

- **POST** `/login`

  - Purpose: Authenticate user credentials and return a JWT.
  - Middlewares: `validateLogin`
  - Body (JSON):
    - `email` (string, required)
    - `password` (string, required)
  - Responses:

    - `200` — Success. Body: `{ message: "Login successful", userId }`
    - `401` — Invalid credentials: `{ message: "Invalid credentials" }`
    - `403` — Email not verified yet: `{ message: "Please verify your email address before logging in." }`
    - `500` — Server error

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"jane@example.com","password":"s3cureP@ss"}'
    ```

- **POST** `/logout`

  - Purpose: Log out the current user by blacklisting the provided JWT.
  - Middlewares: `authMiddleware` (required). Provide header: `Authorization: Bearer <token>`
  - Body: none
  - Responses:

    - `200` — Logout successful: `{ message: "Logout successful" }` or if already blacklisted: `{ message: "Already logged out" }`
    - `401` — Missing/invalid/expired/blacklisted token
    - `500` — Server error

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/auth/logout" \
      -H "Authorization: Bearer $TOKEN"
    ```

- **GET** `/verify-email?token=<token>`

  - Purpose: Verify a user's email using the token included in the verification link. The token is expected as a query parameter.
  - Middlewares: none (public GET)
  - Query params:
    - `token` (string, required) — the verification token sent via email
  - Responses:

    - `200` — Email verified; endpoint issues a JWT and returns user info: `{ message: "Email verified successfully! You are now logged in.", userId, email, firstName }`
    - `400` — Missing/invalid/expired token: `{ message: "Invalid or expired verification token." }` or `{ message: "Verification token is missing." }`
    - `500` — Server error

  - Example curl:

    ```bash
    curl "http://localhost:5000/api/auth/verify-email?token=THE_EMAIL_TOKEN"
    ```

- **POST** `/forgot-password`

  - Purpose: Start password reset flow. If the email exists, a reset link is sent by email. For security, the endpoint always responds with a generic success message so attackers cannot enumerate emails.
  - Middlewares: none
  - Body (JSON):
    - `email` (string, required)
  - Responses:

    - `200` — Generic message: `{ message: "If an account with that email exists, a password reset link has been sent." }` (this is returned even when errors occur in sending)
    - `400` — Missing email: `{ message: "Please provide an email." }`
    - `500` — On server error the controller still returns the same `200` generic message to avoid information leakage

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/auth/forgot-password" \
      -H "Content-Type: application/json" \
      -d '{"email":"jane@example.com"}'
    ```

- **POST** `/reset-password?token=<token>`

  - Purpose: Complete the password reset using the token from the reset email.
  - Middlewares: none
  - Query params:
    - `token` (string, required)
  - Body (JSON):
    - `password` (string, required) — new plain-text password; it will be hashed with bcrypt before saving
  - Responses:

    - `200` — Password reset successful: `{ message: "Password has been reset successfully. You can now log in." }`
    - `400` — Missing token or password, or invalid/expired token: `{ message: "Reset token is missing." }` or `{ message: "Invalid or expired password reset token." }`
    - `500` — Server error

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/auth/reset-password?token=THE_RESET_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"password":"MyN3wP@ssw0rd"}'
    ```

Implementation details (quick reference)

- Passwords are hashed using `bcryptjs` with `SALT_ROUNDS` (fallbacks may exist in code).
- Tokens for email verification and password reset are stored hashed in the DB (the controller hashes the incoming token and looks up the user by the hashed token & expiry timestamps).
- `generateToken(userId)` returns a JWT signed with `JWT_SECRET` and expiry `JWT_EXPIRES_IN`.
- Logout stores tokens in a `TokenBlacklist` collection to invalidate them before their expiry.

If you want, I can:

- Add example responses with real JSON samples for each endpoint.
- Add a short quickstart with environment variables and a minimal `.env.example`.

"""
Generated by GitHub Copilot assistant — auth routes summary
"""

---

# Products API — /api/products

This document describes the product management endpoints implemented in `backend/routes/product.routes.js`.

Base path: `/api/products`

Middlewares & Storage

- All routes use `optionalAuthMiddleware` — authentication is optional; if a valid token is provided, `req.user` is populated.
- Admin-only routes (`POST`, `DELETE`) require the `isAdmin` middleware check.
- Image uploads use Cloudinary for storage; STL files are uploaded to Cloudflare R2.
- Product weight is calculated from STL file volumes using the `calculateTotalWeight` service.

Environment variables (for product operations)

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Cloudinary API credentials
- `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME` — Cloudflare R2 storage
- Product pricing uses constants: `PRICE_PER_GRAM`, `MATERIAL_DENSITY_G_PER_CM3`, `SETUP_FEE` (from `utils/constants.js`)

Endpoints

- **GET** `/`

  - Purpose: Retrieve all pre-designed products.
  - Middlewares: `optionalAuthMiddleware`
  - Query params: none
  - Responses:

    - `200` — Array of product objects: `[ { _id, name, type, price, weight, description, storageLink, imagesLinks, timestamps }, ... ]`
    - `500` — Server error

  - Example curl:

    ```bash
    curl "http://localhost:5000/api/products"
    ```

- **GET** `/:productId`

  - Purpose: Retrieve a single product by ID.
  - Middlewares: `optionalAuthMiddleware`
  - URL params:
    - `productId` (MongoDB ObjectId, required)
  - Responses:

    - `200` — Product object: `{ _id, name, type, price, weight, description, storageLink, imagesLinks, timestamps }`
    - `400` — Product not found: `{ message: "Product not found." }`
    - `500` — Server error

  - Example curl:

    ```bash
    curl "http://localhost:5000/api/products/507f1f77bcf86cd799439011"
    ```

- **POST** `/`

  - Purpose: Add a new pre-designed product (admin only). Uploads images to Cloudinary and STL files to Cloudflare R2.
  - Middlewares: `optionalAuthMiddleware`, `isAdmin`, `imageUpload` (multer)
  - Multipart form data:
    - `name` (string, required)
    - `price` (number, required) — price in dollars
    - `description` (string, required)
    - `images` (file array, 1–5 files required) — JPEG, PNG, GIF, or WebP; max 100 MB total
    - `stlFiles` (file array, 1–10 files required) — .stl files only; max 100 MB total
  - Responses:

    - `201` — Product created. Body: `{ message: "Product added successfully", product: { _id, name, type: 'Pre-designed', price, weight, description, storageLink, imagesLinks, timestamps } }`
    - `400` — Missing fields, invalid name, or duplicate product: `{ message: "All fields... are required." }` or `{ message: "A product with this name already exists." }`
    - `500` — Server error (e.g., upload failures, STL parse errors)

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/products" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -F "name=MyProduct" \
      -F "price=29.99" \
      -F "description=A cool product" \
      -F "images=@image1.jpg" \
      -F "images=@image2.png" \
      -F "stlFiles=@model.stl"
    ```

- **DELETE** `/delete/:productId`

  - Purpose: Delete a product and its associated files from Cloudinary and Cloudflare R2 (admin only).
  - Middlewares: `optionalAuthMiddleware`, `isAdmin`
  - URL params:
    - `productId` (MongoDB ObjectId, required)
  - Responses:

    - `200` — Product deleted successfully: `{ message: "Product deleted successfully." }`
    - `400` — Product not found: `{ message: "Product not found." }`
    - `500` — Server error (e.g., storage deletion failures)

  - Example curl:

    ```bash
    curl -X DELETE "http://localhost:5000/api/products/delete/507f1f77bcf86cd799439011" \
      -H "Authorization: Bearer $ADMIN_TOKEN"
    ```

Implementation details (quick reference)

- Product names are sanitized for use as folder names (lowercase, hyphens, no special chars).
- STL file volumes are parsed and converted to weight using material density (from constants).
- Images are stored in Cloudinary under `products/{folderName}` and STL files in Cloudflare R2.
- When a product is deleted, both Cloudinary folder and R2 folder are cleaned up.
- Product type can be `'Pre-designed'` or `'Custom'` (custom products are created via the custom-designs endpoint).

---

# Custom Designs API — /api/custom-designs

This document describes the custom design upload endpoints implemented in `backend/routes/customDesign.routes.js`.

Base path: `/api/custom-designs`

Middlewares & Storage

- No authentication required (public endpoint).
- STL files are uploaded to Cloudflare R2 in a timestamped/sanitized folder.
- A temporary "Custom" product is created in the database with estimated weight and pricing.
- Weight is calculated from STL file volumes; pricing is estimated based on material cost, weight, and a setup fee.

Environment variables (for custom designs)

- `CLOUDFLARE_R2_ENDPOINT`, `CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_R2_BUCKET_NAME` — Cloudflare R2 storage
- Pricing uses constants: `PRICE_PER_GRAM`, `MATERIAL_DENSITY_G_PER_CM3`, `SETUP_FEE` (from `utils/constants.js`)

Endpoints

- **POST** `/upload`

  - Purpose: Upload custom STL design files, calculate weight and estimated price, and create a temporary product record.
  - Middlewares: `stlUpload.array('stlFiles', 10)` (multer for STL parsing)
  - Multipart form data:
    - `customLabel` (string, required) — a label or name for the design; sanitized for folder naming
    - `quantity` (integer, required) — desired quantity; must be ≥ 1 (used for price estimation)
    - `stlFiles` (file array, 1–10 files required) — .stl files only; max 100 MB per file
  - Responses:

    - `200` — Files uploaded and product created. Body:
      ```json
      {
        "message": "Files uploaded and product created.",
        "product": {
          "_id": "...",
          "name": "customLabel",
          "type": "Custom",
          "price": 49.99,
          "weight": 150.5,
          "description": "This is a custom design",
          "storageLink": "custom-label",
          "imagesLinks": [],
          "createdAt": "2025-11-15T...",
          "updatedAt": "2025-11-15T..."
        },
        "quantity": 5,
        "estimatedWeightGrams": 150.5,
        "estimatedPrice": 49.99
      }
      ```
    - `400` — Missing files, invalid label, or invalid quantity: `{ message: "No .stl files were uploaded..." }` or `{ message: "Invalid customLabel or quantity." }`
    - `400` — STL file parsing error (corrupt file): `{ message: "File processing failed. One or more .stl files may be corrupt." }`
    - `400` — Duplicate custom label (rare, but product name must be unique): `{ message: "A product with this name... already exists." }`
    - `500` — Server error

  - Example curl:

    ```bash
    curl -X POST "http://localhost:5000/api/custom-designs/upload" \
      -F "customLabel=MyCustomDesign" \
      -F "quantity=5" \
      -F "stlFiles=@model1.stl" \
      -F "stlFiles=@model2.stl"
    ```

Implementation details (quick reference)

- Custom label names are sanitized for use as folder names (lowercase, hyphens, no special chars).
- STL file volumes are parsed and combined to calculate total weight.
- Price is estimated as: `(weightInGrams × PRICE_PER_GRAM × quantity) + SETUP_FEE` (setup fee is one-time).
- Files are uploaded to Cloudflare R2 under a folder named after the sanitized custom label.
- A "Custom" product is created with `imagesLinks: []` (no images for custom designs).
- The `quantity` parameter is used for price estimation only and is returned in the response for reference.
- This is typically a starting point; the client may proceed to checkout or add the product to cart.
