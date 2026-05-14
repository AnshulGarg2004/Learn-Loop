import mongoose from "mongoose"

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
    throw new Error(
        "Please define the MONGODB_URL environment variable inside .env.local"
    );
}

let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export const ConnectDB = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log("Connecting to MongoDB...");
        cached.promise = mongoose.connect(MONGODB_URL, opts).then((mongoose) => {
            console.log("MongoDB connected Successfully");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Error connecting to MongoDB:", e);
        throw e;
    }

    return cached.conn;
}