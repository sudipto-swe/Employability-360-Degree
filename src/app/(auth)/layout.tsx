/**
 * Auth Layout
 * 
 * Minimal layout for login/register pages — no navbar/footer.
 * Centered card on a subtle gradient background.
 */

import Link from "next/link";
import { Briefcase } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-brand/5 blur-3xl" />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 group"
      >
        <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center group-hover:scale-105 transition-transform">
          <Briefcase className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Employability <span className="text-gradient">360°</span>
        </span>
      </Link>

      {/* Auth card */}
      <div className="w-full max-w-md">
        {children}
      </div>

      {/* Bottom text */}
      <p className="mt-8 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} Employability 360°. All rights reserved.
      </p>
    </div>
  );
}
