import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import User from "@/models/user.model";
import connectDb from "@/lib/connectDb";

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    await connectDb();
    const user = await User.findOne({ clerkId: userId });

    // If user has already completed onboarding, redirect to dashboard
    if (user && user.onboardingCompleted) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
