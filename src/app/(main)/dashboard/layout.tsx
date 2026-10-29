import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import { DashboardTopbar } from "@/components/layout/DashboardTopbar";
import { AiChatbot } from "@/components/dashboard/AiChatbot";

/**
 * Dashboard Layout
 * 
 * Sidebar + main content area. Auth-gated — redirects
 * to login if not authenticated.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — hidden on mobile, visible on md+ */}
      <DashboardSidebar
        userName={session.user.name || "User"}
        userEmail={session.user.email || ""}
        userRole={session.user.role || "JOBSEEKER"}
        userImage={session.user.image || undefined}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardTopbar
          userName={session.user.name || "User"}
          userRole={session.user.role || "JOBSEEKER"}
          userImage={session.user.image || undefined}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
      <AiChatbot />
    </div>
  );
}
