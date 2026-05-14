import mongoose from "mongoose"
import { NextResponse } from "next/server";

export const ConnectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URL!);
        if (!connection) {
            console.log("Cannot connect to db");
        }

        console.log("Mongodb connected Successfully");
        
        
    } catch (error) {
        console.log("Error connecting to MongoDB:", error);
    }
}