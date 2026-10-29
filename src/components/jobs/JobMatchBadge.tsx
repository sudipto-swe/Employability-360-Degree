"use client";

import { useEffect, useState } from "react";
import { CircularMatch } from "@/components/ui/circular-match";
import { Loader2 } from "lucide-react";

interface JobMatchBadgeProps {
  jobSkills: string[];
  userSkills: string[];
}

export function JobMatchBadge({ jobSkills, userSkills }: JobMatchBadgeProps) {
  const [percentage, setPercentage] = useState<number | null>(null);

  useEffect(() => {
    if (!jobSkills.length || !userSkills.length) return;

    const normalizedJobSkills = jobSkills.map((s) =>
      s.toLowerCase().trim().replace(/[.\-_]/g, "")
    );
    const normalizedUserSkills = userSkills.map((s) =>
      s.toLowerCase().trim().replace(/[.\-_]/g, "")
    );

    let matched = 0;
    for (const js of normalizedJobSkills) {
      if (
        normalizedUserSkills.some(
          (us) => us.includes(js) || js.includes(us)
        )
      ) {
        matched++;
      }
    }

    const raw = Math.round((matched / normalizedJobSkills.length) * 100);
    setPercentage(Math.min(raw, 100));
  }, [jobSkills, userSkills]);

  if (!jobSkills.length || !userSkills.length) return null;
  if (percentage === null) {
    return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
  }

  return <CircularMatch percentage={percentage} size={44} strokeWidth={4} />;
}
