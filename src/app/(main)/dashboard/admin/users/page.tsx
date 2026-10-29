import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Users,
  Shield,
  Mail,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Manage Users",
};

function roleBadge(role: string) {
  const map: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    RECRUITER: "bg-blue-100 text-blue-700",
    JOBSEEKER: "bg-emerald-100 text-emerald-700",
  };
  return map[role] || "bg-muted text-muted-foreground";
}

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      emailVerified: true,
    },
  });

  const stats = {
    total: users.length,
    jobseekers: users.filter((u) => u.role === "JOBSEEKER").length,
    recruiters: users.filter((u) => u.role === "RECRUITER").length,
    admins: users.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all platform users and their roles.
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Job Seekers", value: stats.jobseekers },
          { label: "Recruiters", value: stats.recruiters },
          { label: "Admins", value: stats.admins },
        ].map((s) => (
          <Card key={s.label} className="py-4 text-center">
            <CardContent className="pt-0">
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users list */}
      <Card className="py-0 overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Email</span>
          <span className="col-span-2">Role</span>
          <span className="col-span-2">Joined</span>
          <span className="col-span-1">Status</span>
        </div>
        <div className="divide-y">
          {users.map((user) => {
            const initials = (user.name || "U")
              .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

            return (
              <div key={user.id} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:bg-muted/20 transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm truncate">{user.name || "Unnamed"}</span>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-sm text-muted-foreground truncate">
                  <Mail className="w-3 h-3 shrink-0" />
                  {user.email}
                </div>
                <div className="col-span-2">
                  <Badge className={`text-[10px] border-0 ${roleBadge(user.role)}`}>
                    {user.role === "ADMIN" && <Shield className="w-2.5 h-2.5 mr-0.5" />}
                    {user.role}
                  </Badge>
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString("en-BD", { year: "numeric", month: "short", day: "numeric" })}
                </div>
                <div className="col-span-1">
                  <div className={`w-2 h-2 rounded-full ${user.emailVerified ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
