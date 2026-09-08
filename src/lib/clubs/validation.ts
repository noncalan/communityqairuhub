import {
  normalizeTelegramChatId,
  normalizeTelegramGroupUrl,
  normalizeTelegramPublicUsername,
} from "../telegram/validation.ts";

export type ClubInput = {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  logoUrl: string;
  leaderName: string;
  contact: string;
  status: "forming" | "active";
  telegramGroupUrl: string;
  telegramPublicUsername: string;
  telegramChatId: string;
};

export type ValidatedClubInput = Omit<
  ClubInput,
  "logoUrl" | "contact" | "telegramGroupUrl" | "telegramPublicUsername" | "telegramChatId"
> & {
  logoUrl: string | null;
  contact: string | null;
  telegramGroupUrl: string | null;
  telegramPublicUsername: string | null;
  telegramChatId: string | null;
};

export type ClubValidationResult =
  | { ok: true; data: ValidatedClubInput }
  | { ok: false; message: string; fieldErrors: Partial<Record<keyof ClubInput, string>> };

const reservedSlugs = new Set(["new"]);
const unsafeControlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;

function bounded(value: string, min: number, max: number, label: string) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`${label} must be ${min}–${max} characters.`);
  }
  return normalized;
}

export function normalizeClubCategory(value: string) {
  const category = bounded(value, 2, 60, "Category");
  if (unsafeControlCharacters.test(category)) {
    throw new Error("Category contains unsupported control characters.");
  }
  return category;
}

function normalizeLogoUrl(value: string, allowedOrigins: string[]) {
  const input = value.trim();
  if (!input) return null;
  if (input.length > 500) throw new Error("Logo URL is too long.");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid HTTPS logo URL.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.hash ||
    url.search ||
    !allowedOrigins.includes(url.origin)
  ) {
    throw new Error("Use an HTTPS logo URL hosted by QAIRU or its Supabase Storage project.");
  }
  return url.href;
}

function normalizeContact(value: string) {
  const contact = value.trim();
  if (!contact) return null;
  if (contact.length < 3 || contact.length > 160 || /[\u0000-\u001f\u007f]/.test(contact)) {
    throw new Error("Contact must be 3–160 characters.");
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isTelegram = /^@[A-Za-z0-9_]{3,32}$/.test(contact);
  const isPhone = /^\+?[0-9 ()-]{7,24}$/.test(contact);
  let isHttps = false;
  try {
    const url = new URL(contact);
    isHttps = url.protocol === "https:" && !url.username && !url.password;
  } catch {
    isHttps = false;
  }
  if (!isEmail && !isTelegram && !isPhone && !isHttps) {
    throw new Error("Use an email, HTTPS link, @username, or phone number.");
  }
  return contact;
}

export function validateClubInput(
  input: ClubInput,
  options: { allowedLogoOrigins: string[] },
): ClubValidationResult {
  const fieldErrors: Partial<Record<keyof ClubInput, string>> = {};
  const capture = <K extends keyof ClubInput, T>(key: K, operation: () => T) => {
    try {
      return operation();
    } catch (error) {
      fieldErrors[key] = error instanceof Error ? error.message : "Invalid value.";
      return null;
    }
  };

  const name = capture("name", () => bounded(input.name, 3, 80, "Club name"));
  const slug = capture("slug", () => {
    const value = input.slug.trim().toLowerCase();
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ||
      value.length < 3 ||
      value.length > 60 ||
      reservedSlugs.has(value)
    ) {
      throw new Error("Slug must be 3–60 lowercase letters, numbers, or hyphen-separated words.");
    }
    return value;
  });
  const shortDescription = capture("shortDescription", () =>
    bounded(input.shortDescription, 8, 180, "Short description"),
  );
  const description = capture("description", () =>
    bounded(input.description, 8, 600, "Description"),
  );
  const category = capture("category", () => normalizeClubCategory(input.category));
  const logoUrl = capture("logoUrl", () => normalizeLogoUrl(input.logoUrl, options.allowedLogoOrigins));
  const leaderName = capture("leaderName", () => bounded(input.leaderName, 2, 100, "Leader name"));
  const contact = capture("contact", () => normalizeContact(input.contact));
  const status = capture("status", () => {
    if (input.status !== "active" && input.status !== "forming") {
      throw new Error("Choose Active or Inactive draft.");
    }
    return input.status;
  });

  const telegramGroup = capture("telegramGroupUrl", () =>
    input.telegramGroupUrl.trim() ? normalizeTelegramGroupUrl(input.telegramGroupUrl) : null,
  );
  const telegramPublicUsername = capture("telegramPublicUsername", () =>
    normalizeTelegramPublicUsername(input.telegramPublicUsername, telegramGroup),
  );
  const telegramChatId = capture("telegramChatId", () => normalizeTelegramChatId(input.telegramChatId));
  if (telegramChatId && !telegramGroup) {
    fieldErrors.telegramChatId = "Add a Telegram group link before setting a chat ID.";
  }
  if (input.telegramPublicUsername.trim() && !telegramGroup) {
    fieldErrors.telegramPublicUsername = "Add a Telegram group link before setting a public username.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Review the highlighted club details.", fieldErrors };
  }

  return {
    ok: true,
    data: {
      name: name!,
      slug: slug!,
      shortDescription: shortDescription!,
      description: description!,
      category: category!,
      logoUrl,
      leaderName: leaderName!,
      contact,
      status: status!,
      telegramGroupUrl: telegramGroup?.url ?? null,
      telegramPublicUsername,
      telegramChatId,
    },
  };
}

export function slugifyClubName(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
