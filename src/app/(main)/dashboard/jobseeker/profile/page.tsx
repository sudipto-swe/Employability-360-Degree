"use client";

/**
 * Job Seeker Profile Page
 * 
 * Upload resume, manage parsed skills, update personal info,
 * and toggle open-to-work status.
 */

import { useState, useRef, useEffect } from "react";
import {
  User,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  CheckCircle2,
  MapPin,
  Briefcase,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ProfilePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isOpenToWork, setIsOpenToWork] = useState(true);

  const [profile, setProfile] = useState({
    headline: "",
    summary: "",
    location: "",
    expectedSalary: "",
    resumeUrl: "",
  });

  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setProfile({
              headline: data.headline || "",
              summary: data.summary || "",
              location: data.location || "",
              expectedSalary: data.expectedSalary || "",
              resumeUrl: data.resumeUrl || "",
            });
            if (data.parsedSkills) {
              setParsedSkills(data.parsedSkills as string[]);
            }
            setIsOpenToWork(data.isOpenToWork ?? true);
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  /** Handle resume file selection */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      toast.error("Please upload a PDF or Word document.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    setResumeFile(file);
    toast.success(`Resume "${file.name}" selected.`);
  }

  /** Upload resume and trigger AI parsing */
  async function handleUploadAndParse() {
    if (!resumeFile) {
      toast.error("Please select a resume file first.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const uploadRes = await fetch("/api/upload/resume", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();
      
      setProfile((prev) => ({ ...prev, resumeUrl: url }));
      
      setIsUploading(false);
      setIsParsing(true);

      const parseRes = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl: url }),
      });

      if (!parseRes.ok) {
        const errorData = await parseRes.json();
        throw new Error(errorData.error || "Parsing failed");
      }

      const { data } = await parseRes.json();

      if (data) {
        const skillsList = data.skills || [];
        setParsedSkills(skillsList);
        setProfile((prev) => ({
          ...prev,
          headline: data.personalInfo?.fullName ? `${data.personalInfo.fullName} - Candidate` : (data.experience?.[0]?.title ? `${data.experience[0].title} at ${data.experience[0].company || ""}` : prev.headline || "Professional"),
          summary: data.personalInfo?.summary || prev.summary || "AI Parsed summary of skills and experiences.",
          resumeUrl: url,
        }));
      }

      toast.success("Resume uploaded and parsed successfully with AI! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload or parse resume. Please try again.");
    } finally {
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  /** Save profile */
  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          isOpenToWork,
          parsedSkills,
        }),
      });

      if (res.ok) {
        toast.success("Profile saved successfully!");
      } else {
        toast.error("Failed to save profile.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          My <span className="text-gradient">Profile</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Keep your profile up to date to get the best AI-matched job recommendations.
        </p>
      </div>

      {/* Resume Upload */}
      <Card className="py-6">
        <CardHeader className="pt-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Resume / CV
          </CardTitle>
          <CardDescription>
            Upload your resume and our AI will extract your skills, experience, and education automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-sm">
              {resumeFile ? resumeFile.name : "Click to upload your resume"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF or Word • Max 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {resumeFile && (
            <Button
              onClick={handleUploadAndParse}
              className="w-full gradient-brand text-white border-0"
              disabled={isUploading || isParsing}
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
              ) : isParsing ? (
                <><Sparkles className="w-4 h-4 mr-2 animate-pulse" /> AI Parsing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Upload & Parse with AI</>
              )}
            </Button>
          )}

          {/* Parsed skills */}
          {parsedSkills.length > 0 && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  AI Extracted {parsedSkills.length} skills
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {parsedSkills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="py-6">
        <CardHeader className="pt-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Professional Headline</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profile.headline}
                  onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                  placeholder="e.g., Senior React Developer"
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="Dhaka, Bangladesh"
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Expected Salary (BDT/month)</Label>
            <Input
              value={profile.expectedSalary}
              onChange={(e) => setProfile({ ...profile, expectedSalary: e.target.value })}
              placeholder="e.g., 80,000 - 120,000"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Professional Summary</Label>
            <Textarea
              value={profile.summary}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              placeholder="Write a brief summary about your professional background..."
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">Open to Work</p>
              <p className="text-xs text-muted-foreground">
                Let recruiters know you&apos;re actively looking for opportunities.
              </p>
            </div>
            <Switch
              checked={isOpenToWork}
              onCheckedChange={setIsOpenToWork}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="gradient-brand text-white border-0 px-8"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Profile
        </Button>
      </div>
    </div>
  );
}
