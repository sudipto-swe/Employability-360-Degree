import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Employability 360° — AI-Powered Job Portal for Bangladesh",
    template: "%s | Employability 360°",
  },
  description:
    "Find your dream job in Bangladesh with AI-powered resume parsing, smart job matching, AI CV builder, and interview coaching. For job seekers and recruiters.",
  keywords: [
    "jobs in bangladesh",
    "bd jobs",
    "ai resume builder",
    "job portal",
    "cv builder",
    "interview preparation",
    "bangladesh career",
    "employability",
  ],
  authors: [{ name: "Employability 360°" }],
  openGraph: {
    type: "website",
    locale: "en_BD",
    title: "Employability 360° — AI-Powered Job Portal",
    description:
      "Smart job matching, AI CV builder, and interview coaching for Bangladesh.",
    siteName: "Employability 360°",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
