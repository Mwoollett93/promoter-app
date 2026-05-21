import { Suspense } from "react";
import type { Metadata } from "next";

import AuthLandingPage from "@/app/components/auth/AuthLandingPage";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] text-[#A1A1AA]">
      Loading...
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthLandingPage />
    </Suspense>
  );
}
