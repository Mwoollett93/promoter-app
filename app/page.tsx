import { Suspense } from "react";

import AuthLandingPage from "@/app/components/auth/AuthLandingPage";

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0B10] text-[#A1A1AA]">
      Loading...
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthLandingPage />
    </Suspense>
  );
}
