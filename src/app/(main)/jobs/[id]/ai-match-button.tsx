"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function AIMatchButton({ jobId }: { jobId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [matchData, setMatchData] = useState<{
    matchPercentage: number;
    analysis: string;
    missingSkills: string[];
  } | null>(null);

  async function handleCheckMatch() {
    setIsLoading(true);
    setMatchData(null);
    try {
      const res = await fetch("/api/ai/job-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMatchData(data.matchResult);
    } catch (err: any) {
      toast.error(err.message || "Failed to check match score");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4 mt-6">
      {!matchData ? (
        <Button 
          variant="outline" 
          className="w-full bg-gradient-to-r from-violet-100 to-purple-100 border-violet-200 text-violet-700 hover:text-violet-800"
          onClick={handleCheckMatch}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Check AI Match Score
        </Button>
      ) : (
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100 shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-violet-900 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-violet-600" />
                AI Match Result
              </h4>
              <span className="font-bold text-violet-700">{matchData.matchPercentage}% Match</span>
            </div>
            <Progress value={matchData.matchPercentage} className="h-2" />
            <p className="text-sm text-violet-800 leading-relaxed">
              {matchData.analysis}
            </p>
            {matchData.missingSkills && matchData.missingSkills.length > 0 && (
              <div className="text-sm">
                <span className="font-semibold text-violet-900">Missing Skills: </span>
                <span className="text-violet-700">{matchData.missingSkills.join(", ")}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setMatchData(null)} className="w-full text-violet-600 hover:text-violet-800 hover:bg-violet-100">
              Reset
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
