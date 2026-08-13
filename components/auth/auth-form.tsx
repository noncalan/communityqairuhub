"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/auth/service";
import { isLiveMode } from "@/lib/app-mode";

type Mode = "sign-in" | "sign-up" | "forgot" | "reset";

const copy = {
  "sign-in": {
    title: "Welcome back",
    desc: "Sign in with your QAIRU student account.",
    submit: "Sign in",
  },
  "sign-up": {
    title: "Create your account",
    desc: "Start with your email. You’ll build your student profile next.",
    submit: "Create account",
  },
  forgot: {
    title: "Reset your password",
    desc: "We’ll email you a secure reset link.",
    submit: "Send reset link",
  },
  reset: {
    title: "Choose a new password",
    desc: "Use at least eight characters.",
    submit: "Update password",
  },
} satisfies Record<Mode, { title: string; desc: string; submit: string }>;

function authErrorMessage(message: string) {
  if (/invalid login credentials/i.test(message)) {
    return "Email or password is incorrect.";
  }
  if (/email not confirmed/i.test(message)) {
    return "Confirm your email before signing in.";
  }
  if (/user already registered/i.test(message)) {
    return "Authentication could not be completed. Try signing in or resetting your password.";
  }
  if (/rate limit/i.test(message)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return "Authentication could not be completed. Please try again.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const content = copy[mode];

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (mode !== "reset" && !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if ((mode === "sign-in" || mode === "sign-up" || mode === "reset") && password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }
    if ((mode === "sign-up" || mode === "reset") && password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    if (!isLiveMode) {
      window.setTimeout(() => {
        setLoading(false);
        router.push(mode === "sign-up" ? "/onboarding" : "/home");
      }, 450);
      return;
    }

    try {
      if (mode === "sign-up") {
        const { data, error } = await authService.signUp(email, password);
        if (error) throw error;
        if (!data.session) {
          router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        router.replace("/onboarding");
      } else if (mode === "sign-in") {
        const { error } = await authService.signIn(email, password);
        if (error) throw error;
        router.replace("/home");
        router.refresh();
      } else if (mode === "forgot") {
        const { error } = await authService.requestPasswordReset(email);
        if (error) throw error;
        setSentTo(email);
      } else {
        const { error } = await authService.updatePassword(password);
        if (error) throw error;
        toast.success("Password updated.");
        router.replace("/home");
        router.refresh();
      }
    } catch (error) {
      toast.error(
        authErrorMessage(
          error instanceof Error ? error.message : "Authentication failed.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="w-full max-w-sm">
        <p className="eyebrow">Check your inbox</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          Reset link sent
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          If an account exists for <strong>{sentTo}</strong>, you’ll receive a
          secure password reset link.
        </p>
        <Button asChild className="mt-7 w-full" variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <p className="eyebrow">Student access</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        {content.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {content.desc}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode !== "reset" && (
          <Field
            label="Email"
            name="email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
          />
        )}
        {(mode === "sign-in" || mode === "sign-up" || mode === "reset") && (
          <Field
            label={mode === "reset" ? "New password" : "Password"}
            name="password"
            placeholder="At least 8 characters"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        )}
        {(mode === "sign-up" || mode === "reset") && (
          <Field
            label="Confirm password"
            name="confirmPassword"
            placeholder="Repeat your password"
            type="password"
            autoComplete="new-password"
          />
        )}
        {mode === "sign-in" && (
          <div className="-mt-1 text-end">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          </div>
        )}
        <Button className="w-full" size="lg" disabled={loading}>
          {loading ? "Please wait…" : content.submit}
        </Button>
      </form>
      <p className="mt-7 text-center text-xs text-muted-foreground">
        {mode === "sign-in" ? (
          <>
            New to QAIRU Hub?{" "}
            <Link className="font-medium text-foreground hover:underline" href="/sign-up">
              Create an account
            </Link>
          </>
        ) : mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link className="font-medium text-foreground hover:underline" href="/login">
              Sign in
            </Link>
          </>
        ) : (
          <Link className="font-medium text-foreground hover:underline" href="/login">
            Back to sign in
          </Link>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  name: string;
  placeholder: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input className="mt-2 h-11" required {...props} />
    </label>
  );
}
