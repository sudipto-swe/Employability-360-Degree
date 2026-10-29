"use client";

/**
 * Apply Button Component
 * 
 * Handles job application flow — checks auth, prevents duplicates,
 * and submits the application with loading state.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ApplyButtonProps {
  jobId: string;
}

export function ApplyButton({ jobId }: ApplyButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  async function handleApply(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();
    setIsLoading(true);

    const coverLetter = showCoverLetter
      ? (document.getElementById("cover-letter") as HTMLTextAreaElement)?.value
      : undefined;

    try {
      const response = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverLetter }),
      });

      const data = await response.json();

      if (response.status === 401) {
        toast.error("Please sign in to apply for this job.");
        router.push(`/login?callbackUrl=/jobs/${jobId}`);
        return;
      }

      if (response.status === 409) {
        setHasApplied(true);
        toast.info("You've already applied to this job.");
        return;
      }

      if (!response.ok) {
        toast.error(data.error || "Failed to submit application.");
        return;
      }

      setHasApplied(true);
      toast.success("Application submitted successfully! 🎉");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (hasApplied) {
    return (
      <div className="text-center py-2">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <p className="font-semibold text-emerald-600">Applied!</p>
        <p className="text-xs text-muted-foreground mt-1">
          You&apos;ll be notified when the recruiter responds.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="space-y-3">
      {showCoverLetter && (
        <div className="space-y-2">
          <Label htmlFor="cover-letter">Cover Letter (optional)</Label>
          <Textarea
            id="cover-letter"
            placeholder="Tell the recruiter why you're a great fit..."
            rows={4}
            className="text-sm"
          />
        </div>
      )}

      <Button
        type="submit"
        className="w-full gradient-brand text-white border-0 h-11 hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Apply Now
      </Button>

      {!showCoverLetter && (
        <button
          type="button"
          onClick={() => setShowCoverLetter(true)}
          className="w-full text-xs text-primary hover:underline py-1"
        >
          + Add a cover letter
        </button>
      )}
    </form>
  );
}
