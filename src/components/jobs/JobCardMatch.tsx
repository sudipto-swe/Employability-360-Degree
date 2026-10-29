"use client";

import { JobMatchBadge } from "./JobMatchBadge";

interface JobCardMatchProps {
  jobSkills: string[];
  userSkills: string[];
}

export function JobCardMatch({ jobSkills, userSkills }: JobCardMatchProps) {
  if (!userSkills.length || !jobSkills.length) return null;

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <JobMatchBadge jobSkills={jobSkills} userSkills={userSkills} />
    </div>
  );
}
