"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Globe,
  Users,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface RecruiterProfileState {
  companyName: string;
  companyWebsite: string;
  companyDescription: string;
  industry: string;
  companySize: string;
}

export default function RecruiterProfilePage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<RecruiterProfileState>({
    companyName: "",
    companyWebsite: "",
    companyDescription: "",
    industry: "",
    companySize: "",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            setProfile({
              companyName: data.companyName || "",
              companyWebsite: data.companyWebsite || "",
              companyDescription: data.companyDescription || "",
              industry: data.industry || "",
              companySize: data.companySize || "",
            });
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

  async function handleSave() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        toast.success("Company profile saved successfully!");
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
          Company <span className="text-gradient">Profile</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your company details to attract top talent.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Company Details
          </CardTitle>
          <CardDescription>
            These details are shown on your job postings to candidates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={profile.companyName}
              onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
              placeholder="e.g., TechVentures BD"
              className="h-11"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Website URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="companyWebsite"
                  value={profile.companyWebsite}
                  onChange={(e) => setProfile(prev => ({ ...prev, companyWebsite: e.target.value }))}
                  placeholder="https://example.com"
                  className="pl-9 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select
                value={profile.companySize}
                onValueChange={(val) => setProfile(prev => ({ ...prev, companySize: val || "" }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 employees</SelectItem>
                  <SelectItem value="11-50">11-50 employees</SelectItem>
                  <SelectItem value="51-200">51-200 employees</SelectItem>
                  <SelectItem value="201-500">201-500 employees</SelectItem>
                  <SelectItem value="501+">501+ employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={profile.industry}
              onChange={(e) => setProfile(prev => ({ ...prev, industry: e.target.value }))}
              placeholder="e.g., Software, E-commerce, Finance"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea
              id="companyDescription"
              value={profile.companyDescription}
              onChange={(e) => setProfile(prev => ({ ...prev, companyDescription: e.target.value }))}
              placeholder="Tell candidates about your company mission, culture, and achievements..."
              rows={6}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              className="gradient-brand text-white border-0 px-8 h-11"
              disabled={isSaving || !profile.companyName.trim()}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Profile</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
