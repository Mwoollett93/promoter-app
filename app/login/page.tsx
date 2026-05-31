import type { Metadata } from "next";

import AuthLandingPage from "@/app/components/auth/AuthLandingPage";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

type LoginPageProps = {
  searchParams: Promise<{ view?: string; signout?: string; step?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialView =
    params.view === "signup" || params.view === "reset" ? params.view : "login";

  return (
    <AuthLandingPage
      initialView={initialView}
      signout={params.signout === "1"}
      mfaStep={params.step === "mfa"}
    />
  );
}
