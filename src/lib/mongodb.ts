import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== "production") {
  global.mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    cached.promise = null;
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(
      msg.includes("ECONNREFUSED") || msg.includes("MongoNetworkError")
        ? "Cannot connect to MongoDB. Is it running? (e.g. brew services start mongodb-community)"
        : msg
    );
  }
}
