"use client";

/**
 * Dashboard Topbar
 * 
 * Responsive top navigation with mobile menu toggle,
 * search, notifications, and user dropdown.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Bell,
  Menu,
  Search,
  LogOut,
  User,
  Settings,
  Briefcase,
  X,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  userName: string;
  userRole: string;
  userImage?: string;
}

export function DashboardTopbar({ userName, userRole, userImage }: TopbarProps) {
  const pathname = usePathname();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumb = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex items-center gap-2 px-6 h-16 border-b">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm">Employability 360°</span>
            </div>
            <nav className="p-4">
              <p className="text-xs text-muted-foreground mb-3 px-2">Navigation</p>
              {/* Simplified mobile nav — will be enhanced later */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"
              >
                Dashboard
              </Link>
              <Link
                href="/jobs"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-muted"
              >
                Browse Jobs
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumb.map(({ label, href, isLast }) => (
            <span key={href} className="flex items-center gap-1">
              {!isLast ? (
                <>
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                  </Link>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </>
              ) : (
                <span className="font-medium text-foreground">{label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-2">
        {/* Search toggle (mobile) */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
        >
          {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </Button>

        {/* Search (desktop) */}
        <div className="hidden sm:flex relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-9 w-9 rounded-full" />}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={userImage} alt={userName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                  {userRole}
                </Badge>
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href={userRole === "RECRUITER" ? "/dashboard/recruiter/profile" : userRole === "ADMIN" ? "/dashboard/admin" : "/dashboard/jobseeker/profile"} className="cursor-pointer" />}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/dashboard" className="cursor-pointer" />}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile search bar (expanded) */}
      {mobileSearchOpen && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-card border-b sm:hidden z-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, candidates..."
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}
