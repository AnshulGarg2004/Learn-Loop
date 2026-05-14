import User from "@/models/user.model"
import { auth, currentUser } from "@clerk/nextjs/server";
import { ConnectDB } from "./connectDb";

export const syncUser = async () => {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        console.log("User id didn't come from clerk");
        return null;
    }

    try {
        await ConnectDB();

        const existingUser = await User.findOne({ clerkId });

        if (existingUser) {
            console.log("User already exists");
            return existingUser;
        }

        const clerkUser = await currentUser();
        if (!clerkUser) {
            return null;
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        const imageUrl = clerkUser.imageUrl || "";

        const user = await User.create({
            clerkId,
            email,
            name,
            imageUrl,
            onboardingCompleted: false
        });

        console.log("User created successfully: ", user);

        return user;

    } catch (error: any) {
        console.error("Error occurred while syncing user:", error.message);
        return null;
    }
}