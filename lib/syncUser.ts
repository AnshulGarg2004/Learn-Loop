import User from "@/models/user.model"
import { auth } from "@clerk/nextjs/server";

import { NextResponse } from "next/server";
import { ConnectDB } from "./connectDb";

export const syncUser = async () => {

    const { userId: clerkId } = await auth();
    if (!clerkId) {
        console.log("User id didn't come from clerk");
        return;
    }

    try {
        await ConnectDB();

        const existingUser = await User.findOne({ clerkId });

        if (existingUser) {
            console.log("User already exists", existingUser);
            return NextResponse.json({ success: true, message: "User already exist", existingUser : existingUser }, { status: 200 });
        }

        const user = await User.create({ clerkId });

        console.log("User created successfully: ", user);

        return NextResponse.json({ success: true, message: "User created", user }, { status: 201 });

    } catch (error: any) {
        console.error("Error occurred while syncing user:", error.message);
        return NextResponse.json({ success: false, message: "Error occurred while syncing user" }, { status: 500 });
    }

}