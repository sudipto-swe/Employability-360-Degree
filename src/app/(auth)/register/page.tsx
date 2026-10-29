import { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your Employability 360° account — job seeker or recruiter",
};

import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
