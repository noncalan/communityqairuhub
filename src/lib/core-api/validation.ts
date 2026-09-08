export const CORE_RESOURCES = ["users", "events", "communities", "projects"] as const;

export type CoreResource = (typeof CORE_RESOURCES)[number];
export type MutationMode = "create" | "update";
export type ValidatedPayload = Record<string, string | number | boolean | null>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: Record<string, string> };

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const usernamePattern = /^[a-z0-9_]{3,30}$/;
const unsafeControlCharacters = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u;
const reservedUsernames = new Set([
  "admin", "api", "auth", "login", "onboarding", "qairu", "root",
  "settings", "signup", "support", "system", "www",
]);

type Parser = (value: unknown) => string | number | boolean | null;
type FieldDefinition = {
  create?: "required" | "optional";
  update?: boolean;
  parse: Parser;
};

function text(min: number, max: number, label: string): Parser {
  return (value) => {
    if (typeof value !== "string") throw new Error(`${label} must be a string.`);
    const normalized = value.trim().replace(/\s+/g, " ");
    if (normalized.length < min || normalized.length > max) {
      throw new Error(`${label} must be between ${min} and ${max} characters.`);
    }
    if (unsafeControlCharacters.test(normalized)) {
      throw new Error(`${label} contains unsupported control characters.`);
    }
    return normalized;
  };
}

function optionalText(min: number, max: number, label: string): Parser {
  return (value) => {
    if (value === null) return null;
    return text(min, max, label)(value);
  };
}

function uuid(label: string): Parser {
  return (value) => {
    if (typeof value !== "string" || !uuidPattern.test(value)) {
      throw new Error(`${label} must be a valid UUID.`);
    }
    return value.toLowerCase();
  };
}

function nullableUuid(label: string): Parser {
  return (value) => value === null ? null : uuid(label)(value);
}

function boolean(label: string): Parser {
  return (value) => {
    if (typeof value !== "boolean") throw new Error(`${label} must be a boolean.`);
    return value;
  };
}

function integer(min: number, max: number, label: string): Parser {
  return (value) => {
    if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
      throw new Error(`${label} must be an integer between ${min} and ${max}.`);
    }
    return value as number;
  };
}

function oneOf(values: readonly string[], label: string): Parser {
  return (value) => {
    if (typeof value !== "string" || !values.includes(value)) {
      throw new Error(`${label} must be one of: ${values.join(", ")}.`);
    }
    return value;
  };
}

function slug(value: unknown) {
  if (typeof value !== "string") throw new Error("Slug must be a string.");
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 3 || normalized.length > 60 || !slugPattern.test(normalized)) {
    throw new Error("Slug must be 3–60 lowercase letters, numbers, or hyphen-separated words.");
  }
  return normalized;
}

function username(value: unknown) {
  if (typeof value !== "string") throw new Error("Username must be a string.");
  const normalized = value.trim().toLowerCase();
  if (!usernamePattern.test(normalized)) {
    throw new Error("Username must be 3–30 lowercase letters, numbers, or underscores.");
  }
  if (reservedUsernames.has(normalized)) throw new Error("Username is reserved.");
  return normalized;
}

function nullableHttpsUrl(label: string): Parser {
  return (value) => {
    if (value === null) return null;
    if (typeof value !== "string") throw new Error(`${label} must be a string or null.`);
    if (value.length > 500) throw new Error(`${label} must be at most 500 characters.`);
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      throw new Error(`${label} must be a valid HTTPS URL.`);
    }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      throw new Error(`${label} must be a valid HTTPS URL without credentials.`);
    }
    return parsed.href;
  };
}

function timestamp(label: string): Parser {
  return (value) => {
    if (typeof value !== "string" || !/(?:Z|[+-]\d{2}:\d{2})$/i.test(value)) {
      throw new Error(`${label} must be an ISO 8601 timestamp with a timezone.`);
    }
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      throw new Error(`${label} must be a valid ISO 8601 timestamp.`);
    }
    return parsed.toISOString();
  };
}

const userFields: Record<string, FieldDefinition> = {
  id: { create: "required", parse: uuid("id") },
  username: { create: "required", update: true, parse: username },
  full_name: { create: "required", update: true, parse: text(2, 80, "full_name") },
  bio: { create: "optional", update: true, parse: (value) => {
    if (typeof value !== "string" || value.length > 500) {
      throw new Error("bio must be a string of at most 500 characters.");
    }
    if (unsafeControlCharacters.test(value)) throw new Error("bio contains unsupported control characters.");
    return value.trim();
  } },
  avatar_url: { create: "optional", update: true, parse: nullableHttpsUrl("avatar_url") },
  program_id: { create: "optional", update: true, parse: nullableUuid("program_id") },
  academic_year: { create: "required", update: true, parse: integer(1, 8, "academic_year") },
  available_for_projects: { create: "optional", update: true, parse: boolean("available_for_projects") },
  open_to_collaboration: { create: "optional", update: true, parse: boolean("open_to_collaboration") },
  profile_visibility: { create: "optional", update: true, parse: oneOf(["campus", "private"], "profile_visibility") },
  onboarding_completed: { create: "optional", update: true, parse: boolean("onboarding_completed") },
};

const communityFields: Record<string, FieldDefinition> = {
  id: { create: "optional", parse: uuid("id") },
  slug: { create: "required", update: true, parse: slug },
  name: { create: "required", update: true, parse: text(3, 80, "name") },
  category: { create: "required", update: true, parse: text(2, 60, "category") },
  description: { create: "required", update: true, parse: text(8, 600, "description") },
  short_description: { create: "optional", update: true, parse: optionalText(8, 180, "short_description") },
  logo_url: { create: "optional", update: true, parse: nullableHttpsUrl("logo_url") },
  leader_name: { create: "optional", update: true, parse: optionalText(2, 100, "leader_name") },
  contact: { create: "optional", update: true, parse: optionalText(3, 160, "contact") },
  status: { create: "optional", update: true, parse: oneOf(["forming", "active"], "status") },
  creator_id: { create: "required", parse: uuid("creator_id") },
};

const projectFields: Record<string, FieldDefinition> = {
  id: { create: "optional", parse: uuid("id") },
  slug: { create: "required", update: true, parse: slug },
  name: { create: "required", update: true, parse: text(3, 100, "name") },
  tagline: { create: "required", update: true, parse: text(5, 160, "tagline") },
  description: { create: "required", update: true, parse: text(10, 3000, "description") },
  category: { create: "required", update: true, parse: text(2, 60, "category") },
  status: { create: "optional", update: true, parse: oneOf(["idea", "building", "launched", "completed"], "status") },
  creator_id: { create: "required", parse: uuid("creator_id") },
};

const eventFields: Record<string, FieldDefinition> = {
  id: { create: "optional", parse: uuid("id") },
  slug: { create: "required", update: true, parse: slug },
  title: { create: "required", update: true, parse: text(3, 120, "title") },
  description: { create: "required", update: true, parse: text(8, 2000, "description") },
  category: { create: "required", update: true, parse: text(2, 60, "category") },
  starts_at: { create: "required", update: true, parse: timestamp("starts_at") },
  ends_at: { create: "required", update: true, parse: timestamp("ends_at") },
  location: { create: "required", update: true, parse: text(2, 160, "location") },
  capacity: { create: "required", update: true, parse: integer(1, 10_000, "capacity") },
  organizer_id: { create: "required", parse: uuid("organizer_id") },
};

const definitions: Record<CoreResource, Record<string, FieldDefinition>> = {
  users: userFields,
  communities: communityFields,
  projects: projectFields,
  events: eventFields,
};

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function validatePayload(
  resource: CoreResource,
  raw: unknown,
  mode: MutationMode,
): ValidationResult<ValidatedPayload> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, fieldErrors: { body: "Request body must be a JSON object." } };
  }

  const input = raw as Record<string, unknown>;
  const fields = definitions[resource];
  const data: ValidatedPayload = {};
  const fieldErrors: Record<string, string> = {};

  for (const key of Object.keys(input)) {
    const field = fields[key];
    if (!field || (mode === "update" && !field.update)) {
      fieldErrors[key] = "Field is not allowed.";
      continue;
    }
    try {
      data[key] = field.parse(input[key]);
    } catch (error) {
      fieldErrors[key] = error instanceof Error ? error.message : "Field is invalid.";
    }
  }

  if (mode === "create") {
    for (const [key, field] of Object.entries(fields)) {
      if (field.create === "required" && !(key in input)) {
        fieldErrors[key] = "Field is required.";
      }
    }
  } else if (Object.keys(input).length === 0) {
    fieldErrors.body = "At least one editable field is required.";
  }

  if (resource === "events" && "starts_at" in data && "ends_at" in data) {
    if (new Date(data.ends_at as string) <= new Date(data.starts_at as string)) {
      fieldErrors.ends_at = "ends_at must be after starts_at.";
    }
  }

  return Object.keys(fieldErrors).length
    ? { ok: false, fieldErrors }
    : { ok: true, data };
}

export function parsePagination(url: string): ValidationResult<{ limit: number; offset: number }> {
  const search = new URL(url).searchParams;
  const allowed = new Set(["limit", "offset"]);
  const fieldErrors: Record<string, string> = {};
  for (const key of search.keys()) {
    if (!allowed.has(key)) fieldErrors[key] = "Query parameter is not supported.";
  }

  const parse = (name: "limit" | "offset", fallback: number, min: number, max: number) => {
    const values = search.getAll(name);
    if (values.length > 1 || (values[0] !== undefined && !/^\d+$/.test(values[0]))) {
      fieldErrors[name] = `${name} must be a single integer between ${min} and ${max}.`;
      return fallback;
    }
    const value = values[0] === undefined ? fallback : Number(values[0]);
    if (!Number.isSafeInteger(value) || value < min || value > max) {
      fieldErrors[name] = `${name} must be between ${min} and ${max}.`;
      return fallback;
    }
    return value;
  };

  const limit = parse("limit", 50, 1, 100);
  const offset = parse("offset", 0, 0, 10_000);
  return Object.keys(fieldErrors).length
    ? { ok: false, fieldErrors }
    : { ok: true, data: { limit, offset } };
}
