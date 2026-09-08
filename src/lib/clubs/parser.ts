import type { PublicClub } from "./data.ts";
import { validateClubInput } from "./validation.ts";
import { validateClubBotKey } from "../telegram/validation.ts";

type UnknownRecord = Record<string, unknown>;

export type InvalidClubContext = {
  source: "public_clubs" | "managed_club";
  rowIndex?: number;
  clubId: string | null;
  clubSlug: string | null;
  invalidFields: string[];
};

export type InvalidClubLogger = (context: InvalidClubContext) => void;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeIdentity(row: unknown) {
  if (!isRecord(row)) return { clubId: null, clubSlug: null };
  return {
    clubId: typeof row.id === "string" && uuidPattern.test(row.id) ? row.id : null,
    clubSlug: typeof row.slug === "string" && slugPattern.test(row.slug) ? row.slug : null,
  };
}

function stringField(row: UnknownRecord, key: string, invalidFields: string[]) {
  const value = row[key];
  if (typeof value !== "string") {
    invalidFields.push(key);
    return "";
  }
  return value;
}

function nullableStringField(row: UnknownRecord, key: string, invalidFields: string[]) {
  const value = row[key];
  if (value === null) return "";
  if (typeof value !== "string") {
    invalidFields.push(key);
    return "";
  }
  return value;
}

function validTimestamp(value: unknown) {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

export function firstRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function parsePublicClubRow(
  row: unknown,
  options: { allowedLogoOrigins: string[] },
): { ok: true; club: PublicClub } | { ok: false; invalidFields: string[] } {
  if (!isRecord(row)) return { ok: false, invalidFields: ["row"] };

  const invalidFields: string[] = [];
  const id = stringField(row, "id", invalidFields);
  const status = stringField(row, "status", invalidFields);
  const botKey = stringField(row, "telegram_bot_key", invalidFields);
  const createdAt = stringField(row, "created_at", invalidFields);
  const updatedAt = stringField(row, "updated_at", invalidFields);
  const telegramConfigured = row.telegram_configured;

  if (!uuidPattern.test(id)) invalidFields.push("id");
  if (status !== "active") invalidFields.push("status");
  try {
    validateClubBotKey(botKey);
  } catch {
    invalidFields.push("telegram_bot_key");
  }
  if (!validTimestamp(createdAt)) invalidFields.push("created_at");
  if (!validTimestamp(updatedAt)) invalidFields.push("updated_at");
  if (typeof telegramConfigured !== "boolean") invalidFields.push("telegram_configured");

  const validation = validateClubInput({
    name: stringField(row, "name", invalidFields),
    slug: stringField(row, "slug", invalidFields),
    shortDescription: stringField(row, "short_description", invalidFields),
    description: stringField(row, "description", invalidFields),
    category: stringField(row, "category", invalidFields),
    logoUrl: nullableStringField(row, "logo_url", invalidFields),
    leaderName: stringField(row, "leader_name", invalidFields),
    contact: nullableStringField(row, "contact", invalidFields),
    status: status === "forming" ? "forming" : "active",
    telegramGroupUrl: nullableStringField(row, "telegram_group_url", invalidFields),
    telegramPublicUsername: nullableStringField(row, "telegram_public_username", invalidFields),
    telegramChatId: "",
  }, options);

  if (!validation.ok) invalidFields.push(...Object.keys(validation.fieldErrors));
  const fields = [...new Set(invalidFields)].sort();
  if (!validation.ok || fields.length) return { ok: false, invalidFields: fields };
  if (telegramConfigured !== Boolean(validation.data.telegramGroupUrl)) {
    return { ok: false, invalidFields: ["telegram_configured"] };
  }

  return {
    ok: true,
    club: {
      id,
      slug: validation.data.slug,
      name: validation.data.name,
      shortDescription: validation.data.shortDescription,
      description: validation.data.description,
      category: validation.data.category,
      logoUrl: validation.data.logoUrl,
      leaderName: validation.data.leaderName,
      contact: validation.data.contact,
      status: "active",
      botKey,
      telegramConfigured,
      telegramGroupUrl: validation.data.telegramGroupUrl,
      telegramPublicUsername: validation.data.telegramPublicUsername,
      createdAt,
      updatedAt,
    },
  };
}

export function parsePublicClubRows(
  rows: unknown[],
  options: { allowedLogoOrigins: string[] },
  logInvalid: InvalidClubLogger,
) {
  const clubs: PublicClub[] = [];
  rows.forEach((row, rowIndex) => {
    const parsed = parsePublicClubRow(row, options);
    if (parsed.ok) {
      clubs.push(parsed.club);
      return;
    }
    logInvalid({
      source: "public_clubs",
      rowIndex,
      ...safeIdentity(row),
      invalidFields: parsed.invalidFields,
    });
  });
  return clubs;
}

export function managedClubIdentity(row: unknown) {
  return safeIdentity(row);
}
