"use client";

/**
 * Admin Settings Page
 * 
 * Platform configuration and preferences.
 */

import { useState } from "react";
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Save,
  Loader2,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    platformName: "Employability 360°",
    supportEmail: "support@employability360.com",
    maxFreeJobs: "3",
    autoApproveJobs: true,
    emailNotifications: true,
    maintenanceMode: false,
    requireEmailVerification: true,
  });

  async function handleSave() {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsSaving(false);
    toast.success("Settings saved successfully!");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure platform-wide settings and preferences.
        </p>
      </div>

      {/* General */}
      <Card className="py-6">
        <CardHeader className="pt-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-2">
            <Label>Platform Name</Label>
            <Input
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Support Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Max Free Job Posts (per recruiter)</Label>
            <Input
              type="number"
              value={settings.maxFreeJobs}
              onChange={(e) => setSettings({ ...settings, maxFreeJobs: e.target.value })}
              className="h-11 w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="py-6">
        <CardHeader className="pt-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Features & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {[
            {
              label: "Auto-approve job listings",
              description: "New job posts go live immediately without admin review.",
              key: "autoApproveJobs" as const,
            },
            {
              label: "Require email verification",
              description: "Users must verify their email before accessing the platform.",
              key: "requireEmailVerification" as const,
            },
            {
              label: "Maintenance mode",
              description: "Temporarily disable public access for maintenance.",
              key: "maintenanceMode" as const,
              danger: true,
            },
          ].map((item) => (
            <div key={item.key} className={`flex items-center justify-between p-4 rounded-lg ${item.danger ? "bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800" : "bg-muted/50"}`}>
              <div>
                <p className="font-medium text-sm flex items-center gap-2">
                  {item.label}
                  {item.danger && <Badge variant="destructive" className="text-[10px]">Caution</Badge>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <Switch
                checked={settings[item.key]}
                onCheckedChange={(v) => setSettings({ ...settings, [item.key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="py-6">
        <CardHeader className="pt-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-sm">Email notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receive email alerts for new registrations and flagged content.
              </p>
            </div>
            <Switch
              checked={settings.emailNotifications}
              onCheckedChange={(v) => setSettings({ ...settings, emailNotifications: v })}
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
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
