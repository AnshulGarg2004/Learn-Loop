import User from "@/models/user.model"
import { auth, currentUser } from "@clerk/nextjs/server";
import connectDb from "./connectDb";


export const syncUser = async () => {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
        console.log("User id didn't come from clerk");
        return null;
    }

    try {
        await connectDb();

        let existingUser = await User.findOne({ clerkId });

        if (existingUser) {
            console.log("User already exists by clerkId");
            return existingUser;
        }

        const clerkUser = await currentUser();
        if (!clerkUser) {
            return null;
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress || "";
        const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();
        const imageUrl = clerkUser.imageUrl || "";

        // Check if user exists by email (e.g. they recreated their Clerk account)
        if (email) {
            existingUser = await User.findOne({ email });
            if (existingUser) {
                console.log("User exists by email, merging accounts by updating clerkId");
                existingUser.clerkId = clerkId;
                existingUser.name = name;
                existingUser.imageUrl = imageUrl;
                await existingUser.save();
                return existingUser;
            }
        }

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