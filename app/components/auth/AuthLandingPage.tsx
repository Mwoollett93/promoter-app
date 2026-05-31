"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  HelpCircle,
  Lock,
  Mail,
  Send,
  User,
  Users,
} from "lucide-react";

import AuthField from "@/app/components/auth/AuthField";
import { getLandingPagePath, reactivateAccount } from "@/lib/settings/settings";
import { validatePasswordPolicy } from "@/lib/auth/password-policy";
import { bootstrapSettingsFromAuth } from "@/lib/settings/user-bootstrap";
import {
  getPasswordStrength,
  strengthLabelText,
} from "@/app/components/auth/password-strength";
import {
  DEMO_LOGIN_EMAIL,
  DEMO_LOGIN_PASSWORD,
  getStoredSession,
  getSupabaseConfig,
  isDemoAuthEnabled,
  isDemoSession,
  sendPasswordResetEmail,
  signInAsDemo,
  signInWithPassword,
  signOutOfSupabase,
  signUpWithPassword,
  startOAuthSignIn,
} from "@/lib/supabase/browser";

type AuthView = "login" | "signup" | "reset";

const REMEMBER_KEY = "promosync.auth.remember";

const teamSizeOptions = [
  "Just me",
  "2-5 people",
  "6-15 people",
  "16-50 people",
  "51+ people",
];

type AuthLandingPageProps = {
  initialView?: AuthView;
  signout?: boolean;
};

export default function AuthLandingPage({
  initialView = "login",
  signout = false,
}: AuthLandingPageProps) {
  const router = useRouter();

  const [view, setView] = React.useState<AuthView>(initialView);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [existingSession, setExistingSession] = React.useState(false);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [fullName, setFullName] = React.useState("");
  const [companyName, setCompanyName] = React.useState("");
  const [teamSize, setTeamSize] = React.useState(teamSizeOptions[0]);
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);

  const hasSupabase = Boolean(getSupabaseConfig());
  const demoAuthEnabled = isDemoAuthEnabled();
  const passwordStrength = getPasswordStrength(password);

  React.useEffect(() => {
    async function bootstrap() {
      if (signout) {
        await signOutOfSupabase();
        setExistingSession(false);
        router.replace("/login", { scroll: false });
      } else {
        reactivateAccount();
        setExistingSession(Boolean(getStoredSession()));
      }

      setBootstrapping(false);

      try {
        const remembered = window.localStorage.getItem(REMEMBER_KEY);
        if (remembered === "true") setRememberMe(true);
      } catch {
        /* ignore */
      }
    }

    void bootstrap();
  }, [router, signout]);

  React.useEffect(() => {
    setView(initialView);
  }, [initialView]);

  function switchView(next: AuthView) {
    setView(next);
    setError(null);
    setSuccess(null);
    router.replace(next === "login" ? "/login" : `/login?view=${next}`, { scroll: false });
  }

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (!hasSupabase && !demoAuthEnabled) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const session = await signInWithPassword(email, password);
      if (!isDemoSession(session)) {
        bootstrapSettingsFromAuth({
          userId: session.user.id,
          email: session.user.email,
          metadata: session.user.metadata,
        });
      }
      window.localStorage.setItem(REMEMBER_KEY, rememberMe ? "true" : "false");
      reactivateAccount();
      router.push(getLandingPagePath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoSignIn() {
    if (!demoAuthEnabled) return;

    setLoading(true);
    setError(null);

    try {
      signInAsDemo();
      reactivateAccount();
      router.push(getLandingPagePath());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start demo mode.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (!hasSupabase) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    const passwordCheck = validatePasswordPolicy(password);
    if (!passwordCheck.ok) {
      setError(passwordCheck.message);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const session = await signUpWithPassword({
        email,
        password,
        fullName,
        companyName,
        teamSize,
      });
      bootstrapSettingsFromAuth({
        userId: session.user.id,
        email: session.user.email ?? email,
        fullName,
        companyName,
        metadata: session.user.metadata,
      });
      reactivateAccount();
      router.push(getLandingPagePath());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to create account.";
      if (message.includes("confirm")) {
        setSuccess(message);
        setError(null);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: React.FormEvent) {
    event.preventDefault();
    if (!hasSupabase) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(email);
      setSuccess("Reset link sent. Check your inbox for instructions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple") {
    if (!hasSupabase) return;
    setError(null);
    try {
      await startOAuthSignIn(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start social sign in.");
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0B10] px-4 py-10 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[480px]">
        <AuthBrand />

        {bootstrapping ? null : existingSession ? (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#8B5CF6]/30 bg-[#151320] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-5 text-[#D4D4D8]">
              You&apos;re already signed in. Continue to your dashboard or sign out to use a
              different account.
            </p>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#8B5CF6]/50 bg-[#7C3AED] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#8B5CF6]"
              >
                Go to dashboard
              </button>
              <button
                type="button"
                onClick={async () => {
                  await signOutOfSupabase();
                  setExistingSession(false);
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#3F3F46] bg-[#11111A] px-4 text-[13px] font-medium text-[#F5F5F7] transition-colors hover:border-[#71717A]"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}

        {!hasSupabase ? (
          <div className="mt-6 rounded-xl border border-[#854D0E] bg-[#2A1E0A] px-4 py-3 text-[13px] leading-5 text-[#FCD34D]">
            Add <code className="text-[#F5F5F7]">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-[#F5F5F7]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable sign
            in.
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-[#7F1D1D] bg-[#2B0F14] px-4 py-3 text-[13px] text-[#FCA5A5]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 rounded-xl border border-[#14532D] bg-[#0F2417] px-4 py-3 text-[13px] text-[#86EFAC]">
            {success}
          </div>
        ) : null}

        {view === "login" ? (
          <LoginPanel
            email={email}
            password={password}
            rememberMe={rememberMe}
            loading={loading}
            disabled={!hasSupabase}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onRememberMeChange={setRememberMe}
            onSubmit={handleSignIn}
            onForgotPassword={() => switchView("reset")}
            onCreateAccount={() => switchView("signup")}
            onOAuth={handleOAuth}
            demoAuthEnabled={demoAuthEnabled}
            onDemoSignIn={handleDemoSignIn}
          />
        ) : null}

        {view === "signup" ? (
          <SignUpPanel
            fullName={fullName}
            email={email}
            password={password}
            confirmPassword={confirmPassword}
            companyName={companyName}
            teamSize={teamSize}
            acceptedTerms={acceptedTerms}
            passwordStrength={passwordStrength}
            loading={loading}
            disabled={!hasSupabase}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onCompanyNameChange={setCompanyName}
            onTeamSizeChange={setTeamSize}
            onAcceptedTermsChange={setAcceptedTerms}
            onSubmit={handleSignUp}
            onSignIn={() => switchView("login")}
            onOAuth={handleOAuth}
          />
        ) : null}

        {view === "reset" ? (
          <ResetPanel
            email={email}
            loading={loading}
            disabled={!hasSupabase}
            onEmailChange={setEmail}
            onSubmit={handleReset}
            onBack={() => switchView("login")}
            onOAuth={handleOAuth}
          />
        ) : null}
      </div>
    </main>
  );
}

function AuthBrand() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-3">
        <img
          src="/Promosync_icon.svg"
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 object-contain brightness-0 invert"
        />
        <div>
          <p className="text-left text-[22px] font-bold leading-7 tracking-tight text-[#F5F5F7]">
            PromoSync
          </p>
          <p className="text-left text-[13px] leading-4 text-[#8B5CF6]">Promoter OS</p>
        </div>
      </div>
    </div>
  );
}

function LoginPanel({
  email,
  password,
  rememberMe,
  loading,
  disabled,
  onEmailChange,
  onPasswordChange,
  onRememberMeChange,
  onSubmit,
  onForgotPassword,
  onCreateAccount,
  onOAuth,
  demoAuthEnabled,
  onDemoSignIn,
}: {
  email: string;
  password: string;
  rememberMe: boolean;
  loading: boolean;
  disabled: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  onOAuth: (provider: "google" | "apple") => void;
  demoAuthEnabled: boolean;
  onDemoSignIn: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <header className="text-center">
        <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
          Welcome back
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">Sign in to your account</p>
      </header>

      <AuthField
        label="Email"
        type="email"
        icon={Mail}
        value={email}
        onChange={onEmailChange}
        placeholder="Enter your email"
        autoComplete="email"
      />

      <AuthField
        label="Password"
        type="password"
        icon={Lock}
        value={password}
        onChange={onPasswordChange}
        placeholder="Enter your password"
        autoComplete="current-password"
      />

      <div className="flex items-center justify-between gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-[#A1A1AA]">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => onRememberMeChange(event.target.checked)}
            className="size-4 rounded border-[#3F3F46] bg-[#11111A] text-[#7C3AED] accent-[#7C3AED]"
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
        >
          Forgot password?
        </button>
      </div>

      <PrimaryAuthButton
        loading={loading}
        disabled={disabled && !demoAuthEnabled}
        label="Sign in"
      />

      {demoAuthEnabled ? (
        <div className="rounded-xl border border-[#3F3F46] bg-[#11111A] p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8B5CF6]">
            Demo mode
          </p>
          <p className="mt-2 text-[13px] leading-5 text-[#A1A1AA]">
            Explore the dashboard without Supabase. Use the demo credentials below, or continue
            instantly.
          </p>
          <p className="mt-3 rounded-lg border border-[#232330] bg-[#0B0B10] px-3 py-2 font-mono text-[12px] text-[#D4D4D8]">
            {DEMO_LOGIN_EMAIL}
            <br />
            {DEMO_LOGIN_PASSWORD}
          </p>
          <button
            type="button"
            disabled={loading}
            onClick={onDemoSignIn}
            className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-[#8B5CF6]/45 bg-[#7C3AED]/20 px-4 text-[14px] font-medium text-[#C4B5FD] transition-colors hover:border-[#A78BFA] hover:bg-[#7C3AED]/30 disabled:opacity-50"
          >
            Continue in demo mode
          </button>
        </div>
      ) : null}

      <AuthDivider />
      <SocialAuthButtons disabled={disabled} mode="continue" onOAuth={onOAuth} />

      <p className="text-center text-[14px] text-[#A1A1AA]">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onCreateAccount}
          className="font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
        >
          Create account
        </button>
      </p>
    </form>
  );
}

function SignUpPanel({
  fullName,
  email,
  password,
  confirmPassword,
  companyName,
  teamSize,
  acceptedTerms,
  passwordStrength,
  loading,
  disabled,
  onFullNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onCompanyNameChange,
  onTeamSizeChange,
  onAcceptedTermsChange,
  onSubmit,
  onSignIn,
  onOAuth,
}: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  teamSize: string;
  acceptedTerms: boolean;
  passwordStrength: ReturnType<typeof getPasswordStrength>;
  loading: boolean;
  disabled: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onCompanyNameChange: (value: string) => void;
  onTeamSizeChange: (value: string) => void;
  onAcceptedTermsChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onSignIn: () => void;
  onOAuth: (provider: "google" | "apple") => void;
}) {
  const strengthColor =
    passwordStrength.label === "weak"
      ? "bg-amber-400"
      : passwordStrength.label === "medium"
        ? "bg-amber-300"
        : "bg-emerald-400";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <header className="text-center">
        <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
          Create your account
        </h1>
        <p className="mt-1 text-[14px] leading-5 text-[#A1A1AA]">
          Start planning your next big event.
        </p>
      </header>

      <section className="space-y-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#71717A]">
          Account Information
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="Full Name"
            icon={User}
            value={fullName}
            onChange={onFullNameChange}
            placeholder="Enter your full name"
            autoComplete="name"
          />
          <AuthField
            label="Email"
            type="email"
            icon={Mail}
            value={email}
            onChange={onEmailChange}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            label="Password"
            type="password"
            icon={Lock}
            value={password}
            onChange={onPasswordChange}
            placeholder="Create a password"
            autoComplete="new-password"
          />
          <AuthField
            label="Confirm Password"
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={onConfirmPasswordChange}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </div>

        {password ? (
          <div>
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="text-[#A1A1AA]">
                Password strength:{" "}
                <span className="font-medium text-[#F5F5F7]">
                  {strengthLabelText(passwordStrength.label)}
                </span>
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  className={[
                    "h-1 flex-1 rounded-full",
                    index < passwordStrength.filledSegments ? strengthColor : "bg-[#27272F]",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#71717A]">
          Company / Team
        </p>
        <AuthField
          label="Company / Promoter Name"
          icon={Building2}
          value={companyName}
          onChange={onCompanyNameChange}
          placeholder="Enter company or promoter name"
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium leading-5 text-[#F5F5F7]">
            Team Size <span className="text-[#EF4444]">*</span>
          </span>
          <div className="relative flex h-11 items-center rounded-lg border border-[#3F3F46] bg-[#11111A] px-3.5 transition-colors hover:border-[#71717A] focus-within:border-[#8B5CF6]">
            <Users className="size-4 shrink-0 text-[#71717A]" strokeWidth={2} aria-hidden />
            <select
              value={teamSize}
              onChange={(event) => onTeamSizeChange(event.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent pl-2 pr-6 text-[14px] text-[#F5F5F7] outline-none"
            >
              {teamSizeOptions.map((option) => (
                <option key={option} value={option} className="bg-[#11111A] text-[#F5F5F7]">
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 size-4 text-[#71717A]"
              aria-hidden
            />
          </div>
        </label>
      </section>

      <label className="flex items-start gap-2.5 text-[13px] leading-5 text-[#A1A1AA]">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => onAcceptedTermsChange(event.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-[#3F3F46] bg-[#11111A] accent-[#7C3AED]"
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-[#8B5CF6] hover:text-[#A78BFA]">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#8B5CF6] hover:text-[#A78BFA]">
            Privacy Policy
          </Link>
        </span>
      </label>

      <PrimaryAuthButton loading={loading} disabled={disabled} label="Create account" />

      <AuthDivider />
      <SocialAuthButtons disabled={disabled} mode="signup" onOAuth={onOAuth} />

      <p className="text-center text-[14px] text-[#A1A1AA]">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSignIn}
          className="font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

function ResetPanel({
  email,
  loading,
  disabled,
  onEmailChange,
  onSubmit,
  onBack,
  onOAuth,
}: {
  email: string;
  loading: boolean;
  disabled: boolean;
  onEmailChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
  onOAuth: (provider: "google" | "apple") => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
        Back to sign in
      </button>

      <header>
        <h1 className="text-[32px] font-bold leading-9 tracking-tight text-[#F5F5F7]">
          Reset your password
        </h1>
        <p className="mt-2 text-[14px] leading-5 text-[#A1A1AA]">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </header>

      <AuthField
        label="Email"
        type="email"
        icon={Mail}
        value={email}
        onChange={onEmailChange}
        placeholder="Enter your email"
        autoComplete="email"
      />

      <PrimaryAuthButton
        loading={loading}
        disabled={disabled}
        label="Send reset link"
        icon={Send}
      />

      <AuthDivider />
      <SocialAuthButtons disabled={disabled} mode="continue" onOAuth={onOAuth} />

      <div className="rounded-xl border border-[#232330] bg-[#11111A] p-4">
        <div className="flex gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#181824] text-[#A78BFA]">
            <HelpCircle className="size-4" strokeWidth={2} aria-hidden />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#F5F5F7]">Can&apos;t access your email?</p>
            <p className="mt-1 text-[13px] leading-5 text-[#A1A1AA]">
              If you&apos;re having trouble accessing your account email, contact our support team
              and we can help verify your identity.
            </p>
            <a
              href="mailto:support@promosync.app"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-[#8B5CF6] transition-colors hover:text-[#A78BFA]"
            >
              Contact Support
              <ArrowRight className="size-3.5" strokeWidth={2} aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </form>
  );
}

function PrimaryAuthButton({
  label,
  loading,
  disabled,
  icon: Icon = ArrowRight,
}: {
  label: string;
  loading: boolean;
  disabled: boolean;
  icon?: typeof ArrowRight;
}) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[rgba(139,92,246,0.45)] bg-[#7C3AED] px-6 text-[16px] font-medium text-white transition-all hover:border-[#A855F7] hover:bg-[linear-gradient(178.683deg,#7C3AED_4.7705%,rgba(71,33,135,0.76)_96.232%)] hover:shadow-[0_0_24px_0_rgba(139,92,246,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span>{loading ? "Please wait..." : label}</span>
      {!loading ? <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden /> : null}
    </button>
  );
}

function AuthDivider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#232330]" />
      <span className="text-[13px] text-[#71717A]">or</span>
      <span className="h-px flex-1 bg-[#232330]" />
    </div>
  );
}

function SocialAuthButtons({
  disabled,
  mode,
  onOAuth,
}: {
  disabled: boolean;
  mode: "continue" | "signup";
  onOAuth: (provider: "google" | "apple") => void;
}) {
  const prefix = mode === "signup" ? "Sign up with" : "Continue with";

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOAuth("google")}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#3F3F46] bg-transparent px-4 text-[14px] font-medium text-[#F5F5F7] transition-colors hover:border-[#71717A] hover:bg-[#11111A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SocialBrandIcon>
          <GoogleIcon />
        </SocialBrandIcon>
        <span>{prefix} Google</span>
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onOAuth("apple")}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#3F3F46] bg-transparent px-4 text-[14px] font-medium text-[#F5F5F7] transition-colors hover:border-[#71717A] hover:bg-[#11111A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SocialBrandIcon>
          <AppleIcon />
        </SocialBrandIcon>
        <span>{prefix} Apple</span>
      </button>
    </div>
  );
}

function SocialBrandIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex size-[18px] shrink-0 items-center justify-center">
      {children}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.9 5.9 0 0 1-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-[18px]"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="geometricPrecision"
    >
      <path
        fill="#FFFFFF"
        fillRule="nonzero"
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
      />
    </svg>
  );
}
