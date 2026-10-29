import Link from "next/link";
import {
  Briefcase,
  FileText,
  Brain,
  Sparkles,
  ArrowRight,
  Search,
  MapPin,
  Users,
  Building2,
  TrendingUp,
  Star,
  ChevronRight,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

/** Category data for the job category section */
const CATEGORIES = [
  { name: "Software Engineering", icon: "💻", count: 320, slug: "software-engineering" },
  { name: "Marketing & Sales", icon: "📈", count: 185, slug: "marketing-sales" },
  { name: "Design & Creative", icon: "🎨", count: 142, slug: "design-creative" },
  { name: "Finance & Accounting", icon: "💰", count: 98, slug: "finance-accounting" },
  { name: "Education & Training", icon: "📚", count: 210, slug: "education-training" },
  { name: "Healthcare", icon: "🏥", count: 76, slug: "healthcare" },
  { name: "Customer Support", icon: "🎧", count: 165, slug: "customer-support" },
  { name: "Data & Analytics", icon: "📊", count: 88, slug: "data-analytics" },
];

/** Stats displayed in the hero section */
const STATS = [
  { label: "Active Jobs", value: "2,500+", icon: Briefcase },
  { label: "Companies", value: "800+", icon: Building2 },
  { label: "Job Seekers", value: "50,000+", icon: Users },
  { label: "Placements", value: "12,000+", icon: TrendingUp },
];

/** Feature cards for the "How it works" section */
const FEATURES = [
  {
    title: "AI Resume Parser",
    description:
      "Upload your CV and our AI extracts skills, experience, and education — instantly creating your professional profile.",
    icon: FileText,
    gradient: "from-teal-500 to-emerald-500",
  },
  {
    title: "Smart Job Matching",
    description:
      "Our AI compares your profile with thousands of jobs using vector embeddings — surfacing the most relevant opportunities.",
    icon: Sparkles,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "AI CV Builder",
    description:
      "Answer guided questions, and our AI generates an ATS-friendly CV with beautiful templates. Export as PDF or DOCX.",
    icon: Brain,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    title: "Interview Coach",
    description:
      "Practice with AI-generated interview questions tailored to your target role. Get instant feedback and score your answers.",
    icon: Star,
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ════════ NAVBAR ════════ */}
      <nav className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-brand flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Employability <span className="text-gradient">360°</span>
              </span>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <Link
                href="/jobs"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse Jobs
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link href="/register">
                <Button size="sm" className="gradient-brand text-white border-0 hover:opacity-90 transition-opacity">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Link href="/register">
                <Button size="sm" className="gradient-brand text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ════════ HERO SECTION ════════ */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-brand/5 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-1.5 text-sm font-medium gap-1.5"
            >
              <Globe className="w-3.5 h-3.5" />
              Bangladesh&apos;s AI-Powered Job Platform
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Your Career, Powered by{" "}
              <span className="text-gradient">
                Artificial Intelligence
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Upload your resume, get AI-matched to jobs, build stunning CVs,
              and ace interviews with our AI coach — all in one platform
              built for Bangladesh.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-xl bg-card border shadow-lg">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Job title, skill, or keyword..."
                    className="pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none"
                  />
                </div>
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Dhaka, Chittagong, Remote..."
                    className="pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none"
                  />
                </div>
                <Link href="/jobs">
                  <Button className="gradient-brand text-white border-0 px-8 w-full sm:w-auto hover:opacity-90 transition-opacity">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Popular: React Developer, Marketing Manager, Data Analyst, UI/UX
                Designer
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {STATS.map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center p-4 rounded-xl bg-card border hover-lift cursor-default"
                >
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <span className="text-2xl font-bold text-foreground">
                    {value}
                  </span>
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FEATURES SECTION ════════ */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-xs">
              AI-POWERED FEATURES
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything You Need to{" "}
              <span className="text-gradient">Land Your Dream Job</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From resume parsing to interview preparation — our AI handles the
              heavy lifting so you can focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ title, description, icon: Icon, gradient }) => (
              <Card
                key={title}
                className="group hover-lift border bg-card/80 backdrop-blur-sm cursor-default py-6"
              >
                <CardContent className="pt-0">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ JOB CATEGORIES ════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 text-xs">
              EXPLORE CATEGORIES
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Browse by <span className="text-gradient">Category</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore opportunities across Bangladesh&apos;s fastest-growing industries.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map(({ name, icon, count, slug }) => (
              <Link
                key={slug}
                href={`/jobs?category=${slug}`}
                className="group"
              >
                <Card className="hover-lift border bg-card py-5 transition-all group-hover:border-primary/30">
                  <CardContent className="flex flex-col items-center text-center pt-0">
                    <span className="text-3xl mb-3">{icon}</span>
                    <h3 className="font-medium text-sm mb-1">{name}</h3>
                    <span className="text-xs text-muted-foreground">
                      {count} jobs
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA SECTION ════════ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl gradient-brand p-10 md:p-16 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Transform Your Career?
              </h2>
              <p className="text-white/80 max-w-xl mx-auto mb-8 text-lg">
                Join thousands of professionals across Bangladesh who are using
                AI to find better opportunities, faster.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 font-semibold px-8 w-full sm:w-auto"
                  >
                    Create Free Account
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
                <Link href="/register?role=recruiter">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 w-full sm:w-auto"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    I&apos;m Hiring
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ FOOTER ════════ */}
      <footer className="border-t bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">Employability 360°</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bangladesh&apos;s AI-powered job platform connecting talent with
                opportunity.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-sm mb-4">For Job Seekers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/jobs" className="hover:text-foreground transition-colors">Browse Jobs</Link></li>
                <li><Link href="/dashboard/jobseeker/cv-builder" className="hover:text-foreground transition-colors">AI CV Builder</Link></li>
                <li><Link href="/dashboard/jobseeker/interview-coach" className="hover:text-foreground transition-colors">Interview Coach</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">For Recruiters</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/register?role=recruiter" className="hover:text-foreground transition-colors">Post a Job</Link></li>
                <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard/recruiter/candidates" className="hover:text-foreground transition-colors">Find Talent</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Employability 360°. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              Built with ❤️ for Bangladesh
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
