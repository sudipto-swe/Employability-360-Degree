"use client";

/**
 * Dashboard Sidebar
 * 
 * Role-aware navigation sidebar with links specific
 * to job seekers, recruiters, or admins.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  FileText,
  Brain,
  MessageSquare,
  LayoutDashboard,
  User,
  Bookmark,
  CreditCard,
  Users,
  BarChart3,
  PlusCircle,
  Kanban,
  Settings,
  Mic,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: string;
  userImage?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

/** Navigation links per role */
function getNavItems(role: string): NavItem[] {
  if (role === "RECRUITER") {
    return [
      { label: "Dashboard", href: "/dashboard/recruiter", icon: LayoutDashboard },
      { label: "Post a Job", href: "/dashboard/recruiter/post-job", icon: PlusCircle },
      { label: "My Jobs", href: "/dashboard/recruiter/jobs", icon: Briefcase },
      { label: "Candidates", href: "/dashboard/recruiter/candidates", icon: Users },
      { label: "Pipeline", href: "/dashboard/recruiter/pipeline", icon: Kanban },
      { label: "Messages", href: "/dashboard/recruiter/messages", icon: MessageSquare },
      { label: "Company Profile", href: "/dashboard/recruiter/profile", icon: User },
      { label: "Analytics", href: "/dashboard/recruiter/analytics", icon: BarChart3 },
      { label: "Subscription", href: "/dashboard/recruiter/subscription", icon: CreditCard },
    ];
  }

  if (role === "ADMIN") {
    return [
      { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Users", href: "/dashboard/admin/users", icon: Users },
      { label: "Jobs", href: "/dashboard/admin/jobs", icon: Briefcase },
      { label: "Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
      { label: "Settings", href: "/dashboard/admin/settings", icon: Settings },
    ];
  }

  // JOBSEEKER (default)
  return [
    { label: "Dashboard", href: "/dashboard/jobseeker", icon: LayoutDashboard },
    { label: "My Applications", href: "/dashboard/jobseeker/applications", icon: FileText },
    { label: "AI CV Builder", href: "/dashboard/jobseeker/cv-builder", icon: Brain, badge: "AI" },
    { label: "Interview Coach", href: "/dashboard/jobseeker/interview-coach", icon: Mic, badge: "AI" },
    { label: "Saved Jobs", href: "/dashboard/jobseeker/saved", icon: Bookmark },
    { label: "Messages", href: "/dashboard/jobseeker/messages", icon: MessageSquare },
    { label: "Profile", href: "/dashboard/jobseeker/profile", icon: User },
    { label: "Subscription", href: "/dashboard/jobseeker/subscription", icon: CreditCard },
  ];
}

export function DashboardSidebar({ userName, userRole, userImage }: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(userRole);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole === "RECRUITER" ? "Recruiter" : userRole === "ADMIN" ? "Admin" : "Job Seeker";

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 flex-col bg-card border-r h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b shrink-0">
        <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight">
          Employability <span className="text-gradient">360°</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ label, href, icon: Icon, badge: badgeText }) => {
            const isActive = pathname === href || (href !== "/dashboard/jobseeker" && href !== "/dashboard/recruiter" && href !== "/dashboard/admin" && pathname.startsWith(href));

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
                  <span className="truncate">{label}</span>
                  {badgeText && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 h-5 bg-brand/10 text-brand border-0"
                    >
                      {badgeText}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="border-t p-4 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
