import mongoose from "mongoose";

const connectDb = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL!);
        if (!conn) {
            console.log("Cannot connect to db");
        }

        console.log("Mongodb connected successfully");


    } catch (error: any) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}

export default connectDb;