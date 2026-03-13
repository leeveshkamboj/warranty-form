# Product Warranty Registration

A Next.js app with a product warranty registration form (inspired by [Cognito Forms Product Warranty Registration](https://www.cognitoforms.com/Registerproductforwarranty/ProductWarrantyRegistration)) and an admin area to view submissions. Data is stored in MongoDB.

## Features

- **Form page** (`/register`) – Contact info, address, product details (name, serial number, purchase date, place of purchase, category, etc.)
- **Submit to MongoDB** – Registrations are saved via `/api/register`
- **Admin** (`/admin`) – Username/password login; dashboard at `/admin/dashboard` to view all registrations

## Setup

### 1. Environment variables

Copy the example env and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- **MONGODB_URI** – Your MongoDB connection string (e.g. from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)).
- **SESSION_SECRET** – A long random string used to sign the admin session cookie (e.g. `openssl rand -hex 32`).

### 2. Create admin users

Admin users are stored in MongoDB. Add your first admin (run from project root, after `MONGODB_URI` is set):

```bash
npm run add-admin -- admin your-password
# or: node scripts/add-admin.js admin your-password
```

To add more users later, run the same command with a different username and password.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Home** – Links to the registration form and admin.
- **Register product** – Warranty registration form.
- **Admin** – Log in with the username and password you configured; then view the registrations table.

## Tech

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **MongoDB** via Mongoose
- **Admin auth** – Users stored in MongoDB; add users with `npm run add-admin -- <username> <password>`. Session cookie signed with `SESSION_SECRET`; password checked with bcrypt
