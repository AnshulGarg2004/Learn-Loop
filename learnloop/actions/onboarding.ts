"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import User from "@/models/user.model";
import { ConnectDB } from "@/lib/connectDb";

export async function completeOnboarding(formData: FormData) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const role = formData.get("role") as string;
    const college = formData.get("college") as string;
    const skillsString = formData.get("skills") as string;
    const subjectsString = formData.get("subjects") as string;
    const languagesString = formData.get("languages") as string;
    const learningInterestsString = formData.get("learningInterests") as string;

    // Validate inputs
    if (!role || !college || !skillsString || !subjectsString || !languagesString || !learningInterestsString) {
        throw new Error("All fields are required");
    }

    // Process comma-separated strings
    const skills = skillsString.split(",").map((s) => s.trim()).filter(Boolean);
    const subjects = subjectsString.split(",").map((s) => s.trim()).filter(Boolean);
    const languages = languagesString.split(",").map((s) => s.trim()).filter(Boolean);
    const learningInterests = learningInterestsString.split(",").map((s) => s.trim()).filter(Boolean);

    await ConnectDB();

    const user = await User.findOneAndUpdate(
        { clerkId: userId },
        {
            role,
            college,
            skills,
            subjects,
            languages,
            learningInterests,
            onboardingCompleted: true,
        },
        { new: true }
    );

    if (!user) {
        throw new Error("User not found");
    }

    revalidatePath("/dashboard");
    redirect("/dashboard");
}
