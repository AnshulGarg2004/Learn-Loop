import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import User from "@/models/user.model";
import { ConnectDB } from "@/lib/connectDb";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    await ConnectDB();
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.onboardingCompleted) {
        redirect("/onboarding");
    }

    return <>{children}</>;
}
