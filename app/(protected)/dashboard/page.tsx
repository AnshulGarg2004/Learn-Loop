import { auth } from "@clerk/nextjs/server";
import User from "@/models/user.model";
import { ConnectDB } from "@/lib/connectDb";

export default async function DashboardPage() {
    const { userId } = await auth();
    await ConnectDB();
    const user = await User.findOne({ clerkId: userId });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Welcome back, {user?.name || "User"}!</h2>
                <p className="text-gray-600 mb-6">You have successfully completed the onboarding.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
                        <h3 className="font-semibold text-purple-900 mb-2">Your Role</h3>
                        <p className="text-purple-700 capitalize">{user?.role}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-900 mb-2">College</h3>
                        <p className="text-blue-700">{user?.college || "N/A"}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                        <h3 className="font-semibold text-green-900 mb-2">Knowledge Credits</h3>
                        <p className="text-green-700">{user?.knowledgeCredits}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
