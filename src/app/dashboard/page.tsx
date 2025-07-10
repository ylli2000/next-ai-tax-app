import { redirect } from "next/navigation";
import Image from "next/image";
import { auth, signOut } from "@/lib/auth";
import { ROUTES } from "@/schema/routeSchema";
import SessionLogButton from "@/components/btn-dummy";

/**
 * Dashboard page for testing authenticated access
 *
 * This page demonstrates:
 * - Server-side session verification
 * - User information display
 * - Sign out functionality
 * - Protected route access
 */
export default async function DashboardPage() {
    const session = await auth();

    if (!session) {
        redirect(ROUTES.AUTH.SIGNIN);
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Welcome to Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            NextAuth v5 authentication successful! 🎉
                        </p>
                    </div>

                    <div className="px-6 py-4">
                        <div className="space-y-4">
                            {/* User Information */}
                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <h2 className="text-lg font-medium text-green-800 mb-3">
                                    User Session Information
                                </h2>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">
                                            Name:
                                        </span>{" "}
                                        {session.user?.name || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Email:
                                        </span>{" "}
                                        {session.user?.email || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">ID:</span>{" "}
                                        {session.user?.id || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Role:
                                        </span>{" "}
                                        {session.user?.role || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">
                                            Email Verified:
                                        </span>{" "}
                                        {session.user?.emailVerified
                                            ? new Date(
                                                  session.user.emailVerified,
                                              ).toLocaleDateString()
                                            : "Not verified"}
                                    </div>
                                    {session.user?.image && (
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">
                                                Avatar:
                                            </span>
                                            <Image
                                                src={session.user.image}
                                                alt="User avatar"
                                                width={32}
                                                height={32}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Database Check */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <h3 className="text-lg font-medium text-blue-800 mb-2">
                                    Database Integration Test
                                </h3>
                                <p className="text-sm text-blue-600">
                                    ✅ User session created successfully
                                    <br />
                                    ✅ Database user record should be created
                                    via Drizzle adapter
                                    <br />✅ NextAuth v5 + Drizzle ORM
                                    integration working
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-4">
                                <form
                                    action={async () => {
                                        "use server";
                                        await signOut({
                                            redirectTo: ROUTES.AUTH.SIGNIN,
                                        });
                                    }}
                                >
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        Sign Out
                                    </button>
                                </form>

                                <SessionLogButton session={session} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
