"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isLiveMode } from "@/lib/app-mode";
import { authErrorMessage } from "@/lib/auth/auth-errors";
import {
  PASSWORD_REQUIREMENTS,
  PASSWORD_REQUIREMENT_SUMMARY,
  validatePassword,
} from "@/lib/auth/password-policy";
import { authService } from "@/lib/auth/service";
import { safeInternalPath } from "@/lib/security/redirects";
import { getTrustedSiteOrigin } from "@/lib/security/site-origin";

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
    desc: "Set a strong password, then sign in again deliberately.",
    submit: "Update password",
  },
} satisfies Record<Mode, { title: string; desc: string; submit: string }>;

export function AuthForm({
  mode,
  initialMessage = "",
}: {
  mode: Mode;
  initialMessage?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const queryError = searchParams.get("error");
  const queryErrorMessage =
    queryError === "recovery_session_expired" ||
    queryError === "invalid_recovery_session"
      ? "This password reset session is not valid. Request a new reset link."
      : queryError === "confirmation_failed"
        ? "The confirmation link is invalid or expired. Request a new link and try again."
        : queryError === "missing_confirmation_code"
          ? "The confirmation link is incomplete. Request a new link and try again."
          : "";
  const [formError, setFormError] = useState(
    initialMessage || queryErrorMessage,
  );
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [resetSucceeded, setResetSucceeded] = useState(false);
  const content = copy[mode];
  const statusMessage =
    mode === "sign-in" && searchParams.get("reset") === "success"
      ? "Password updated successfully. Sign in with your new password."
      : "";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setPasswordErrors([]);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");

    if (mode !== "reset" && !/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    if (mode === "sign-up" || mode === "reset") {
      const policyErrors = validatePassword(password);
      if (policyErrors.length > 0) {
        setPasswordErrors(policyErrors);
        setFormError(`Choose a stronger password. ${PASSWORD_REQUIREMENT_SUMMARY}`);
        return;
      }
      if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }
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
        const destination =
          safeInternalPath(
            searchParams.get("next"),
            getTrustedSiteOrigin(),
          ) ?? "/home";
        router.replace(destination);
        router.refresh();
      } else if (mode === "forgot") {
        const { error } = await authService.requestPasswordReset(email);
        if (error) throw error;
        setSentTo(email);
      } else {
        const { error } = await authService.updatePassword(password);
        if (error) throw error;

        setResetSucceeded(true);
        const { error: cleanupError } = await authService.endRecoverySession();
        if (cleanupError) {
          setResetSucceeded(false);
          setFormError(
            "Your password was updated, but the temporary recovery session could not be closed. Sign out before continuing.",
          );
          return;
        }

        window.setTimeout(() => {
          router.replace("/sign-in?reset=success");
          router.refresh();
        }, 1200);
      }
    } catch (error) {
      setFormError(authErrorMessage(error, mode));
    } finally {
      setLoading(false);
    }
  }

  async function cancelRecovery() {
    setLoading(true);
    setFormError("");
    const { error } = await authService.endRecoverySession();
    if (error) {
      setFormError(
        "The temporary recovery session could not be closed. Please try again.",
      );
      setLoading(false);
      return;
    }
    router.replace("/sign-in");
    router.refresh();
  }

  if (resetSucceeded) {
    return (
      <div className="w-full max-w-sm" role="status" aria-live="polite">
        <p className="eyebrow">Recovery complete</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
          Password updated successfully
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Your temporary recovery session is closed. Redirecting you to sign in
          with the new password…
        </p>
      </div>
    );
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
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  const showsPasswordPolicy = mode === "sign-up" || mode === "reset";

  return (
    <div className="w-full max-w-sm">
      <p className="eyebrow">Student access</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
        {content.title}
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {content.desc}
      </p>

      {formError && (
        <div
          id="auth-form-error"
          role="alert"
          aria-live="assertive"
          className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {formError}
        </div>
      )}
      {statusMessage && !formError && (
        <div
          role="status"
          aria-live="polite"
          className="mt-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {statusMessage}
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {mode !== "reset" && (
          <Field
            label="Email"
            name="email"
            placeholder="name@example.com"
            type="email"
            autoComplete="email"
            aria-describedby={formError ? "auth-form-error" : undefined}
          />
        )}
        {(mode === "sign-in" || mode === "sign-up" || mode === "reset") && (
          <Field
            label={mode === "reset" ? "New password" : "Password"}
            name="password"
            placeholder={showsPasswordPolicy ? "8+ characters, letters and numbers" : "Your password"}
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            aria-invalid={passwordErrors.length > 0 || undefined}
            aria-describedby={
              showsPasswordPolicy
                ? formError
                  ? "password-requirements auth-form-error"
                  : "password-requirements"
                : formError
                  ? "auth-form-error"
                  : undefined
            }
          />
        )}
        {showsPasswordPolicy && (
          <div id="password-requirements" className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs font-medium">Password requirements</p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {PASSWORD_REQUIREMENTS.map((requirement) => (
                <li key={requirement}>• {requirement}</li>
              ))}
            </ul>
          </div>
        )}
        {(mode === "sign-up" || mode === "reset") && (
          <Field
            label="Confirm password"
            name="confirmPassword"
            placeholder="Repeat your password"
            type="password"
            autoComplete="new-password"
            aria-describedby={formError ? "auth-form-error" : undefined}
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
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
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
            <Link className="font-medium text-foreground hover:underline" href="/sign-in">
              Sign in
            </Link>
          </>
        ) : mode === "reset" ? (
          <button
            type="button"
            className="font-medium text-foreground hover:underline disabled:opacity-50"
            disabled={loading}
            onClick={cancelRecovery}
          >
            Cancel recovery and sign in
          </button>
        ) : (
          <Link className="font-medium text-foreground hover:underline" href="/sign-in">
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
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <Input className="mt-2 h-11" required {...props} />
    </label>
  );
}
