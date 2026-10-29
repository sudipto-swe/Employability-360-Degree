import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Employability 360° account",
};

import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center p-8">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
