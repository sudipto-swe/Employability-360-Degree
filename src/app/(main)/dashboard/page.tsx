import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Dashboard Home — Role-based redirect
 * 
 * Redirects users to their role-specific dashboard:
 * - JOBSEEKER → /dashboard/jobseeker
 * - RECRUITER → /dashboard/recruiter
 * - ADMIN → /dashboard/admin
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  switch (role) {
    case "RECRUITER":
      redirect("/dashboard/recruiter");
    case "ADMIN":
      redirect("/dashboard/admin");
    default:
      redirect("/dashboard/jobseeker");
  }
}
