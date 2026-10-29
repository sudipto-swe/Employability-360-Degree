"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Eye,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Download,
  FileText,
  FolderGit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import generatePDF from "react-to-pdf";
import { Switch } from "@/components/ui/switch";

function formatMonthYear(dateStr: string) {
  if (!dateStr) return "";
  const [year, month] = dateStr.split("-");
  if (!year || !month) return dateStr;
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  summary: string;
}

interface Experience {
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  type: string;
  fieldOfStudy: string;
  degree: string;
  institution: string;
  year: string;
  gpa: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string;
  link: string;
}

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Experience", icon: Briefcase },
  { label: "Education", icon: GraduationCap },
  { label: "Projects", icon: FolderGit2 },
  { label: "Skills", icon: Wrench },
  { label: "Preview", icon: Eye },
];

const JOB_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Product Manager", "Project Manager", "Data Scientist", "Data Analyst",
  "UI/UX Designer", "Marketing Manager", "Sales Executive", "Business Analyst",
  "HR Manager", "Graphic Designer", "Content Writer", "Customer Support", "Other"
];

const YEARS = Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() + 5 - i).toString());

const EDUCATION_TYPES = ["School", "College", "University", "Bootcamp", "Certification", "Other"];
const INSTITUTIONS = ["Dhaka University", "BUET", "BRAC University", "NSU", "AIUB", "IUT", "East West University", "National University", "Other"];
const FIELDS_OF_STUDY = ["Computer Science", "Business Administration", "Electrical Engineering", "Civil Engineering", "Mechanical Engineering", "Economics", "Arts", "Science", "Commerce", "Other"];
const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Java", "C++",
  "HTML", "CSS", "Tailwind CSS", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker",
  "Git", "Communication", "Leadership", "Problem Solving", "Teamwork"
];

export default function CVBuilderPage() {
  const [step, setStep] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    summary: "",
  });

  const [experiences, setExperiences] = useState<Experience[]>([
    { title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" },
  ]);

  const [education, setEducation] = useState<Education[]>([
    { type: "", fieldOfStudy: "", degree: "", institution: "", year: "", gpa: "" },
  ]);

  const [projects, setProjects] = useState<Project[]>([
    { name: "", description: "", technologies: "", link: "" },
  ]);

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillsSelectKey, setSkillsSelectKey] = useState(0);

  const [summaryPrompt, setSummaryPrompt] = useState("");
  const [projectPrompts, setProjectPrompts] = useState<string[]>([""]);

  useEffect(() => {
    async function loadCV() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data?.parsedData) {
            const cv = result.data.parsedData;
            if (cv.personalInfo) setPersonalInfo(cv.personalInfo);
            if (cv.experiences && cv.experiences.length > 0) setExperiences(cv.experiences);
            if (cv.education && cv.education.length > 0) setEducation(cv.education);
            if (cv.projects && cv.projects.length > 0) {
              setProjects(cv.projects);
              setProjectPrompts(cv.projects.map(() => ""));
            }
            if (cv.skills) setSkills(cv.skills);
          }
        }
      } catch (err) {
        console.error("Failed to load CV:", err);
      }
    }
    loadCV();
  }, []);

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  }

  /** AI: Generate professional summary */
  async function generateSummary() {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/cv-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "professional summary",
          context: {
            jobTitle: experiences[0]?.title || "Professional",
            skills: skills.slice(0, 5),
            description: summaryPrompt || `Name: ${personalInfo.fullName}. ${experiences.length} years of experience.`,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPersonalInfo({ ...personalInfo, summary: data.data });
        toast.success("Summary generated!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate summary.");
    } finally {
      setIsAiLoading(false);
    }
  }

  /** AI: Generate Experience Description */
  async function generateExperienceDescription(index: number) {
    const exp = experiences[index];
    if (!exp.title) {
      toast.error("Please enter a job title first.");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/cv-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "experience bullet points",
          context: {
            jobTitle: exp.title,
            company: exp.company,
            skills: skills.slice(0, 5),
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateExperience(index, "description", data.data);
        toast.success("Description generated!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate description.");
    } finally {
      setIsAiLoading(false);
    }
  }

  /** AI: Generate Project Description */
  async function generateProjectDescription(index: number) {
    const proj = projects[index];
    const promptText = projectPrompts[index];
    if (!proj.name) {
      toast.error("Please enter a project name first.");
      return;
    }
    if (!promptText) {
      toast.error("Please provide some keywords or a sentence for the project.");
      return;
    }
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/cv-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "project accomplishments and overview",
          context: {
            jobTitle: proj.name,
            company: proj.technologies,
            description: promptText,
          },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        updateProject(index, "description", data.data);
        toast.success("Project description generated!");
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate project description.");
    } finally {
      setIsAiLoading(false);
    }
  }

  function updateExperience(index: number, field: keyof Experience, value: string | boolean) {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value } as Experience;
    setExperiences(updated);
  }

  function addExperience() {
    setExperiences([
      ...experiences,
      { title: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" },
    ]);
  }

  function removeExperience(index: number) {
    setExperiences(experiences.filter((_, i) => i !== index));
  }

  function updateEducation(index: number, field: keyof Education, value: string) {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  }

  function addEducation() {
    setEducation([...education, { type: "", fieldOfStudy: "", degree: "", institution: "", year: "", gpa: "" }]);
  }

  function removeEducation(index: number) {
    setEducation(education.filter((_, i) => i !== index));
  }

  function updateProject(index: number, field: keyof Project, value: string) {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  }

  function addProject() {
    setProjects([...projects, { name: "", description: "", technologies: "", link: "" }]);
    setProjectPrompts([...projectPrompts, ""]);
  }

  function removeProject(index: number) {
    setProjects(projects.filter((_, i) => i !== index));
    setProjectPrompts(projectPrompts.filter((_, i) => i !== index));
  }

  async function handleSaveCV() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile/cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo,
          experiences: experiences.filter((e) => e.title),
          education: education.filter((e) => e.degree),
          projects: projects.filter((p) => p.name),
          skills,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to save CV.");
        return;
      }
      toast.success("CV saved successfully!");
    } catch {
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          AI CV <span className="text-gradient">Builder</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Create a stunning, ATS-friendly CV with AI assistance.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
              i === step
                ? "bg-primary text-white shadow-sm"
                : i < step
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic contact details for the CV header.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={personalInfo.fullName}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                  placeholder="Your full name"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  placeholder="you@example.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  placeholder="+880 1XXX XXXXXX"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={personalInfo.location}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                  placeholder="Dhaka, Bangladesh"
                  className="h-11"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>LinkedIn</Label>
                <Input
                  value={personalInfo.linkedin}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/yourname"
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold text-sm">AI Summary Generator</Label>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={generateSummary}
                    disabled={isAiLoading}
                    className="gradient-brand text-white border-0 text-xs shadow-sm hover:opacity-95"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                    )}
                    Generate Summary
                  </Button>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">What keywords or sentence should we base your summary on?</Label>
                  <Input
                    value={summaryPrompt}
                    onChange={(e) => setSummaryPrompt(e.target.value)}
                    placeholder="e.g. Frontend developer with 3 years of React experience and passionate about speed optimization"
                    className="h-10 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Professional Summary</Label>
                <Textarea
                  value={personalInfo.summary}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                  placeholder="A brief professional summary highlighting your experience and career goals..."
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Experience */}
      {step === 1 && (
        <div className="space-y-4">
          {experiences.map((exp, i) => (
            <Card key={i} className="py-5">
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Experience {i + 1}</h3>
                  {experiences.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeExperience(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <Select 
                      value={JOB_TITLES.includes(exp.title) ? exp.title : (exp.title ? "Other" : "")} 
                      onValueChange={(v) => updateExperience(i, "title", v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select title" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TITLES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(exp.title === "Other" || (exp.title && !JOB_TITLES.includes(exp.title))) && (
                      <Input
                        value={exp.title === "Other" ? "" : exp.title}
                        onChange={(e) => updateExperience(i, "title", e.target.value)}
                        placeholder="Enter custom job title..."
                        className="mt-2 h-10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Input value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} placeholder="Company Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Input 
                      type="month" 
                      value={exp.startDate} 
                      onChange={(e) => updateExperience(i, "startDate", e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="month" 
                      disabled={exp.current} 
                      value={exp.current ? "" : exp.endDate} 
                      onChange={(e) => updateExperience(i, "endDate", e.target.value)} 
                      className="h-11"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-dashed">
                    <div>
                      <p className="text-xs font-semibold">I currently work in this role</p>
                      <p className="text-[11px] text-muted-foreground">This will set the end date to Present</p>
                    </div>
                    <Switch
                      checked={exp.current}
                      onCheckedChange={(checked) => {
                        updateExperience(i, "current", checked);
                        if (checked) {
                          updateExperience(i, "endDate", "");
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateExperienceDescription(i)}
                      disabled={isAiLoading || !exp.title}
                      className="text-xs"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      AI Generate
                    </Button>
                  </div>
                  <Textarea
                    value={exp.description}
                    onChange={(e) => updateExperience(i, "description", e.target.value)}
                    placeholder="Describe your responsibilities and achievements..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addExperience} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Experience
          </Button>
        </div>
      )}

      {/* Step 2: Education */}
      {step === 2 && (
        <div className="space-y-4">
          {education.map((edu, i) => (
            <Card key={i} className="py-5">
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Education {i + 1}</h3>
                  {education.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeEducation(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type *</Label>
                    <Select value={edu.type} onValueChange={(v) => updateEducation(i, "type", v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Institution *</Label>
                    <Select 
                      value={INSTITUTIONS.includes(edu.institution) ? edu.institution : (edu.institution ? "Other" : "")} 
                      onValueChange={(v) => updateEducation(i, "institution", v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select institution" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTITUTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(edu.institution === "Other" || (edu.institution && !INSTITUTIONS.includes(edu.institution))) && (
                      <Input
                        value={edu.institution === "Other" ? "" : edu.institution}
                        onChange={(e) => updateEducation(i, "institution", e.target.value)}
                        placeholder="Enter custom institution name..."
                        className="mt-2 h-10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Degree *</Label>
                    <Input value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} placeholder="B.Sc. in Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <Label>Field of Study *</Label>
                    <Select 
                      value={FIELDS_OF_STUDY.includes(edu.fieldOfStudy) ? edu.fieldOfStudy : (edu.fieldOfStudy ? "Other" : "")} 
                      onValueChange={(v) => updateEducation(i, "fieldOfStudy", v || "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELDS_OF_STUDY.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(edu.fieldOfStudy === "Other" || (edu.fieldOfStudy && !FIELDS_OF_STUDY.includes(edu.fieldOfStudy))) && (
                      <Input
                        value={edu.fieldOfStudy === "Other" ? "" : edu.fieldOfStudy}
                        onChange={(e) => updateEducation(i, "fieldOfStudy", e.target.value)}
                        placeholder="Enter custom field of study..."
                        className="mt-2 h-10"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Passing Year *</Label>
                    <Select value={edu.year} onValueChange={(v) => updateEducation(i, "year", v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>GPA/CGPA</Label>
                    {(() => {
                      let currentScale = "CGPA (4.0 Scale)";
                      let currentScore = edu.gpa;
                      if (edu.gpa) {
                        if (edu.gpa.includes("(4.0 Scale)")) {
                          currentScale = "CGPA (4.0 Scale)";
                          currentScore = edu.gpa.replace(" (4.0 Scale)", "").trim();
                        } else if (edu.gpa.includes("(5.0 Scale)")) {
                          currentScale = "GPA (5.0 Scale)";
                          currentScore = edu.gpa.replace(" (5.0 Scale)", "").trim();
                        } else if (edu.gpa.includes("(Percentage)")) {
                          currentScale = "Percentage (%)";
                          currentScore = edu.gpa.replace(" (Percentage)", "").trim();
                        } else {
                          currentScale = "Other";
                          currentScore = edu.gpa;
                        }
                      }
                      return (
                        <div className="flex gap-2">
                          <Select 
                            value={currentScale} 
                            onValueChange={(scaleVal) => {
                              updateEducation(i, "gpa", currentScore ? `${currentScore} (${scaleVal})` : "");
                            }}
                          >
                            <SelectTrigger className="w-1/2">
                              <SelectValue placeholder="Select Scale" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CGPA (4.0 Scale)">CGPA (4.0 Scale)</SelectItem>
                              <SelectItem value="GPA (5.0 Scale)">GPA (5.0 Scale)</SelectItem>
                              <SelectItem value="Percentage (%)">Percentage (%)</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            value={currentScore}
                            onChange={(e) => {
                              const newScore = e.target.value;
                              updateEducation(i, "gpa", currentScale && currentScale !== "Other" ? `${newScore} (${currentScale})` : newScore);
                            }}
                            placeholder={currentScale === "Percentage (%)" ? "e.g. 85" : "e.g. 3.85"}
                            className="w-1/2"
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addEducation} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </div>
      )}

      {/* Step 3: Projects */}
      {step === 3 && (
        <div className="space-y-4">
          {projects.map((proj, i) => (
            <Card key={i} className="py-5">
              <CardContent className="pt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Project {i + 1}</h3>
                  {projects.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeProject(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input
                      value={proj.name}
                      onChange={(e) => updateProject(i, "name", e.target.value)}
                      placeholder="e.g. E-Commerce Platform"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Technologies Used *</Label>
                    <Input
                      value={proj.technologies}
                      onChange={(e) => updateProject(i, "technologies", e.target.value)}
                      placeholder="e.g. Next.js, Tailwind CSS, PostgreSQL"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Project Link</Label>
                    <Input
                      value={proj.link}
                      onChange={(e) => updateProject(i, "link", e.target.value)}
                      placeholder="e.g. https://github.com/myusername/myproject"
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-semibold text-sm">AI Project Description Builder</Label>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => generateProjectDescription(i)}
                      disabled={isAiLoading || !proj.name}
                      className="gradient-brand text-white border-0 text-xs shadow-sm hover:opacity-95"
                    >
                      {isAiLoading ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                      )}
                      Generate Description
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">What did you build? Give keywords or a sentence describing this project.</Label>
                    <Input
                      value={projectPrompts[i] || ""}
                      onChange={(e) => {
                        const updated = [...projectPrompts];
                        updated[i] = e.target.value;
                        setProjectPrompts(updated);
                      }}
                      placeholder="e.g. Real-time chat app using socket.io with rooms, message history, and user authentication"
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Description</Label>
                  <Textarea
                    value={proj.description}
                    onChange={(e) => updateProject(i, "description", e.target.value)}
                    placeholder="Provide overview of goals, features, and key metrics achieved..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={addProject} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        </div>
      )}

      {/* Step 4: Skills */}
      {step === 4 && (
        <Card className="py-6">
          <CardHeader className="pt-0">
            <CardTitle>Skills</CardTitle>
            <CardDescription>Add your technical and soft skills.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Select from common skills</Label>
                <Select
                  key={skillsSelectKey}
                  value=""
                  onValueChange={(v: string | null) => {
                    if (v && !skills.includes(v)) {
                      setSkills([...skills, v]);
                      setSkillsSelectKey((prev) => prev + 1);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SKILLS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Or add a custom skill</Label>
                <div className="flex gap-2">
                  <Input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Type a custom skill..."
                    className="h-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={addSkill}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1 pr-1 text-sm">
                  {s}
                  <button onClick={() => setSkills(skills.filter((sk) => sk !== s))}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Preview */}
      {step === 5 && (
        <Card className="py-6">
          <CardContent className="pt-0">
            <div 
              id="cv-preview-content" 
              className="border rounded-lg p-8 bg-white text-black shadow-sm"
              style={{ fontFamily: "Calibri, Arial, Helvetica, sans-serif" }}
            >
              {/* CV Header */}
              <div className="text-center mb-6 border-b pb-4">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900">{personalInfo.fullName || "Your Name"}</h1>
                <p className="text-sm text-gray-600 mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                  {personalInfo.location && <span>• {personalInfo.location}</span>}
                </p>
                {personalInfo.linkedin && (
                  <p className="text-xs text-blue-600 hover:underline mt-1">{personalInfo.linkedin}</p>
                )}
              </div>

              {/* Summary */}
              {personalInfo.summary && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
                    Professional Summary
                  </h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{personalInfo.summary}</p>
                </div>
              )}

              {/* Experience */}
              {experiences.some((e) => e.title) && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
                    Professional Experience
                  </h2>
                  {experiences
                    .filter((e) => e.title)
                    .map((exp, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-sm text-gray-900">{exp.title}</span>
                            {exp.company && <span className="text-sm text-gray-700"> | {exp.company}</span>}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            {formatMonthYear(exp.startDate)} — {exp.current ? "Present" : formatMonthYear(exp.endDate)}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Projects */}
              {projects.some((p) => p.name) && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
                    Key Projects
                  </h2>
                  {projects
                    .filter((p) => p.name)
                    .map((proj, i) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-sm text-gray-900">{proj.name}</span>
                            {proj.technologies && <span className="text-xs text-gray-600 font-semibold italic"> ({proj.technologies})</span>}
                          </div>
                          {proj.link && (
                            <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                              {proj.link.replace(/^https?:\/\/(www\.)?/, "")}
                            </a>
                          )}
                        </div>
                        {proj.description && (
                          <p className="text-sm text-gray-700 mt-1 whitespace-pre-line leading-relaxed">{proj.description}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}

              {/* Education */}
              {education.some((e) => e.degree) && (
                <div className="mb-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
                    Education
                  </h2>
                  {education
                    .filter((e) => e.degree)
                    .map((edu, i) => (
                      <div key={i} className="mb-3">
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-sm text-gray-900">{edu.degree}</span>
                            {edu.fieldOfStudy && <span className="text-sm text-gray-700"> in {edu.fieldOfStudy}</span>}
                            {edu.institution && <span className="text-sm text-gray-600"> — {edu.institution}</span>}
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">{edu.year}</span>
                            {edu.gpa && <span className="text-xs text-gray-500 font-medium">| GPA: {edu.gpa}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2">
                    Technical & Professional Skills
                  </h2>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {skills.join(", ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" onClick={() => generatePDF(() => document.getElementById("cv-preview-content"), { filename: "ATS_Resume.pdf" })}>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </Button>
              <Button 
                className="gradient-brand text-white border-0" 
                onClick={handleSaveCV}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Save CV
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
          className="gradient-brand text-white border-0"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
