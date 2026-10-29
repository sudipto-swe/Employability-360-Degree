"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MapPin,
  Mail,
  Briefcase,
  GraduationCap,
  Download,
  FileText,
  DollarSign,
  User,
} from "lucide-react";

interface CandidateDetailModalProps {
  candidate: {
    userId: string;
    headline: string | null;
    summary: string | null;
    location: string | null;
    expectedSalary: string | null;
    parsedSkills: any;
    experience: any;
    education: any;
    resumeUrl: string | null;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
    };
  };
  trigger: React.ReactElement;
}

export function CandidateDetailModal({ candidate, trigger }: CandidateDetailModalProps) {
  const [open, setOpen] = useState(false);

  // Track profile visit when modal is opened
  useEffect(() => {
    if (open) {
      fetch("/api/profile/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitedUserId: candidate.userId }),
      }).catch((err) => console.error("Error logging visit:", err));
    }
  }, [open, candidate.userId]);

  const initials = (candidate.user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Parse experience and education JSON arrays safely
  const experiences = Array.isArray(candidate.experience)
    ? candidate.experience
    : typeof candidate.experience === "string"
    ? JSON.parse(candidate.experience)
    : [];

  const educations = Array.isArray(candidate.education)
    ? candidate.education
    : typeof candidate.education === "string"
    ? JSON.parse(candidate.education)
    : [];

  const skills = Array.isArray(candidate.parsedSkills)
    ? candidate.parsedSkills
    : typeof candidate.parsedSkills === "string"
    ? JSON.parse(candidate.parsedSkills)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl shadow-xl border border-border/80">
        <DialogHeader className="flex flex-row items-start gap-4 pb-4 border-b">
          <Avatar className="w-16 h-16 ring-2 ring-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {candidate.user.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              {candidate.headline || "Jobseeker Profile"}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {candidate.user.email}
              </span>
              {candidate.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {candidate.location}
                </span>
              )}
              {candidate.expectedSalary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  Expected: {candidate.expectedSalary}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Summary */}
          {candidate.summary && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                Professional Summary
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/35 p-3.5 rounded-xl border border-muted/80">
                {candidate.summary}
              </p>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                Skills & Technologies
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="px-2.5 py-1 text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience Timeline */}
          {experiences.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary" />
                Work Experience
              </h4>
              <div className="space-y-3 border-l-2 border-primary/20 pl-4 ml-2">
                {experiences.map((exp: any, i: number) => (
                  <div key={i} className="relative space-y-1">
                    <span className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm text-foreground">
                        {exp.title}
                      </h5>
                      <span className="text-[11px] text-muted-foreground">
                        {exp.startDate} - {exp.current ? "Present" : exp.endDate || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {exp.company} {exp.location ? `• ${exp.location}` : ""}
                    </p>
                    {exp.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education Timeline */}
          {educations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary" />
                Education & Credentials
              </h4>
              <div className="space-y-3 border-l-2 border-primary/20 pl-4 ml-2">
                {educations.map((edu: any, i: number) => (
                  <div key={i} className="relative space-y-1">
                    <span className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm text-foreground">
                        {edu.degree}
                      </h5>
                      <span className="text-[11px] text-muted-foreground">
                        Class of {edu.year || "N/A"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      {edu.institution} {edu.location ? `• ${edu.location}` : ""}
                    </p>
                    {edu.gpa && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Result: <span className="font-semibold">{edu.gpa}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume file download */}
          {candidate.resumeUrl && (
            <div className="pt-2 border-t flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Attached Resume File</span>
              </div>
              <a
                href={candidate.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Button size="sm" className="gradient-brand text-white border-0">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download PDF
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
