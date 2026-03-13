/**
 * Add a new admin user to MongoDB.
 * Usage: node scripts/add-admin.js <username> <password>
 * Loads MONGODB_URI from .env.local (or .env).
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env.local or .env");
  process.exit(1);
}

const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.error("Usage: node scripts/add-admin.js <username> <password>");
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ username: username.trim() });
  if (existing) {
    console.error(`User "${username}" already exists.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username: username.trim(), passwordHash });
  console.log(`Admin user "${username}" created.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
