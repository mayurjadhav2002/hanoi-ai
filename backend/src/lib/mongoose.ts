import mongoose from "mongoose";

let isConnecting = false;
let isConnected = false;

export async function connectMongo(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "" || uri.includes("<username>")) {
    return null;
  }

  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose;
  }

  if (isConnecting) {
    // Wait for the in-progress connection attempt
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!isConnecting) {
          clearInterval(check);
          resolve(isConnected ? mongoose : null);
        }
      }, 50);
    });
  }

  try {
    isConnecting = true;
    const dbName = process.env.MONGODB_DB_NAME || "hanoi_ai";

    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    console.log(`🍃 [MongoDB] Connected to database: ${dbName}`);

    mongoose.connection.on("error", (err) => {
      console.error("🍃 [MongoDB Error]", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("🍃 [MongoDB] Disconnected.");
      isConnected = false;
    });

    return mongoose;
  } catch (error: any) {
    console.warn(`🍃 [MongoDB Connection Warning] Could not connect to MongoDB: ${error.message}`);
    isConnected = false;
    return null;
  } finally {
    isConnecting = false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected || mongoose.connection.readyState === 1;
}
