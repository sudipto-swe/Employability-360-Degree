"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveJobButtonProps {
  jobId: string;
  initialSaved: boolean;
}

export function SaveJobButton({ jobId, initialSaved }: SaveJobButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(initialSaved);

  async function handleSave() {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: "POST",
      });

      if (response.status === 401) {
        toast.error("Please sign in to save this job.");
        router.push(`/login?callbackUrl=/jobs/${jobId}`);
        return;
      }

      if (!response.ok) {
        toast.error("Failed to save job.");
        return;
      }

      const data = await response.json();
      setIsSaved(data.saved);
      
      if (data.saved) {
        toast.success("Job saved to your profile!");
      } else {
        toast.info("Job removed from saved list.");
      }
      
      // Refresh the route to ensure layout stats (if any) update
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={handleSave}
      disabled={isLoading}
      title={isSaved ? "Remove from saved" : "Save job"}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Bookmark 
          className={cn("w-4 h-4 transition-colors", isSaved && "fill-primary text-primary")} 
        />
      )}
    </Button>
  );
}
