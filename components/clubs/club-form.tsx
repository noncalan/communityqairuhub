"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bot, ExternalLink, Save, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { createClubAction, updateClubAction } from "@/app/actions/clubs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type ClubInput,
  slugifyClubName,
  validateClubInput,
} from "@/lib/clubs/validation";
import {
  buildClubBotDeepLink,
  normalizeTelegramGroupUrl,
} from "@/lib/telegram/validation";

export function ClubForm({
  mode,
  initialValue,
  clubId,
  botKey,
  botUsername,
  allowedLogoOrigins,
}: {
  mode: "create" | "edit";
  initialValue: ClubInput;
  clubId?: string;
  botKey?: string;
  botUsername: string | null;
  allowedLogoOrigins: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValue);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ClubInput, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof ClubInput>(key: K, value: ClubInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: undefined }));
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const validation = validateClubInput(values, { allowedLogoOrigins });
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      setMessage(validation.message);
      return;
    }
    startTransition(async () => {
      const result = mode === "create"
        ? await createClubAction(values)
        : await updateClubAction(clubId!, values);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setMessage(result.message);
        return;
      }
      router.push(values.status === "active" ? `/clubs/${result.slug}` : `/clubs/${result.slug}/edit`);
      router.refresh();
    });
  }

  let groupUrl: string | null = null;
  try {
    groupUrl = values.telegramGroupUrl.trim()
      ? normalizeTelegramGroupUrl(values.telegramGroupUrl).url
      : null;
  } catch {
    groupUrl = null;
  }
  const botDeepLink = botUsername && botKey
    ? buildClubBotDeepLink(botUsername, botKey)
    : null;

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="surface rounded-xl p-5 sm:p-7">
          <p className="eyebrow">Basic information</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Club name" error={fieldErrors.name} className="sm:col-span-2">
              <Input
                value={values.name}
                onChange={(event) => {
                  set("name", event.target.value);
                  if (!slugTouched) set("slug", slugifyClubName(event.target.value));
                }}
                minLength={3}
                maxLength={80}
                required
                autoFocus
                aria-invalid={Boolean(fieldErrors.name)}
              />
            </Field>
            <Field label="Slug" hint="Public URL segment; lowercase words and hyphens." error={fieldErrors.slug}>
              <Input
                value={values.slug}
                onChange={(event) => { setSlugTouched(true); set("slug", event.target.value); }}
                minLength={3}
                maxLength={60}
                required
                aria-invalid={Boolean(fieldErrors.slug)}
              />
            </Field>
            <Field label="Category" error={fieldErrors.category}>
              <Input
                value={values.category}
                onChange={(event) => set("category", event.target.value)}
                minLength={2}
                maxLength={60}
                required
                placeholder="Technology, Arts, Sport…"
                aria-invalid={Boolean(fieldErrors.category)}
              />
            </Field>
            <Field label="Short description" hint="Shown on directory cards (8–180 characters)." error={fieldErrors.shortDescription} className="sm:col-span-2">
              <Textarea
                value={values.shortDescription}
                onChange={(event) => set("shortDescription", event.target.value)}
                minLength={8}
                maxLength={180}
                required
                className="min-h-24"
                aria-invalid={Boolean(fieldErrors.shortDescription)}
              />
            </Field>
            <Field label="Full description" hint="8–600 characters." error={fieldErrors.description} className="sm:col-span-2">
              <Textarea
                value={values.description}
                onChange={(event) => set("description", event.target.value)}
                minLength={8}
                maxLength={600}
                required
                className="min-h-40"
                aria-invalid={Boolean(fieldErrors.description)}
              />
            </Field>
            <Field
              label="Logo URL (optional)"
              hint={allowedLogoOrigins.length
                ? `HTTPS only: ${allowedLogoOrigins.join(", ")}`
                : "Leave blank until a trusted HTTPS logo host is configured."}
              error={fieldErrors.logoUrl}
              className="sm:col-span-2"
            >
              <Input
                type="url"
                value={values.logoUrl}
                onChange={(event) => set("logoUrl", event.target.value)}
                maxLength={500}
                placeholder="https://…"
                aria-invalid={Boolean(fieldErrors.logoUrl)}
              />
            </Field>
          </div>
        </section>

        <section className="surface rounded-xl p-5 sm:p-7">
          <p className="eyebrow">Leadership and publication</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Leader / organizer" error={fieldErrors.leaderName}>
              <Input
                value={values.leaderName}
                onChange={(event) => set("leaderName", event.target.value)}
                minLength={2}
                maxLength={100}
                required
                aria-invalid={Boolean(fieldErrors.leaderName)}
              />
            </Field>
            <Field label="Contact method (optional)" hint="Email, HTTPS link, @username, or phone." error={fieldErrors.contact}>
              <Input
                value={values.contact}
                onChange={(event) => set("contact", event.target.value)}
                maxLength={160}
                placeholder="club@qairu.edu.kz"
                aria-invalid={Boolean(fieldErrors.contact)}
              />
            </Field>
            <Field label="Publication status" hint="Only Active clubs are public and available to the bot." error={fieldErrors.status} className="sm:col-span-2">
              <select
                value={values.status}
                onChange={(event) => set("status", event.target.value as ClubInput["status"])}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                aria-invalid={Boolean(fieldErrors.status)}
              >
                <option value="forming">Inactive draft</option>
                <option value="active">Active</option>
              </select>
            </Field>
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="surface rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Telegram integration</p>
              <h2 className="mt-2 text-lg font-semibold">Club communication</h2>
            </div>
            <Badge variant={groupUrl ? "default" : "secondary"}>
              {groupUrl ? "Group configured" : "Not configured"}
            </Badge>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            “Configured” means a valid group URL is stored. It does not claim that the bot is a group administrator.
          </p>
          <div className="mt-5 space-y-5">
            <Field label="Telegram group URL" error={fieldErrors.telegramGroupUrl}>
              <Input
                type="url"
                value={values.telegramGroupUrl}
                onChange={(event) => set("telegramGroupUrl", event.target.value)}
                maxLength={200}
                placeholder="https://t.me/qairu_club"
                aria-invalid={Boolean(fieldErrors.telegramGroupUrl)}
              />
            </Field>
            <Field label="Public group username (optional)" error={fieldErrors.telegramPublicUsername}>
              <Input
                value={values.telegramPublicUsername}
                onChange={(event) => set("telegramPublicUsername", event.target.value)}
                maxLength={33}
                placeholder="@qairu_club"
                aria-invalid={Boolean(fieldErrors.telegramPublicUsername)}
              />
            </Field>
            <Field label="Telegram chat ID (optional)" hint="Private manager-only connection metadata for future bot administration." error={fieldErrors.telegramChatId}>
              <Input
                value={values.telegramChatId}
                onChange={(event) => set("telegramChatId", event.target.value)}
                maxLength={20}
                inputMode="numeric"
                placeholder="-1001234567890"
                aria-invalid={Boolean(fieldErrors.telegramChatId)}
              />
            </Field>
          </div>

          {mode === "edit" && (
            <div className="mt-6 border-t pt-5">
              <p className="text-xs font-medium">Bot deep link</p>
              <p className="mt-2 break-all rounded-md bg-muted p-3 font-mono text-[11px] text-muted-foreground">
                {botDeepLink ?? "Set TELEGRAM_BOT_USERNAME to generate the link."}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {botDeepLink ? (
                  <Button type="button" variant="outline" asChild>
                    <a href={botDeepLink} target="_blank" rel="noreferrer"><Send className="size-4" /> Open bot</a>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled><Bot className="size-4" /> Open bot</Button>
                )}
                {groupUrl ? (
                  <Button type="button" variant="outline" asChild>
                    <a href={groupUrl} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Open group</a>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" disabled><ExternalLink className="size-4" /> Open group</Button>
                )}
              </div>
            </div>
          )}
        </section>

        {message && (
          <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {message}
          </div>
        )}
        <div className="grid gap-2">
          <Button type="submit" size="lg" disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving…" : mode === "create" ? "Create club" : "Save changes"}
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href={mode === "edit" ? `/clubs/${initialValue.slug}` : "/clubs"}>Cancel</Link>
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`grid gap-1.5 text-sm font-medium ${className ?? ""}`}>
      <span>{label}</span>
      {children}
      {error ? (
        <span className="text-xs font-normal text-destructive">{error}</span>
      ) : hint ? (
        <span className="text-xs font-normal leading-5 text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
