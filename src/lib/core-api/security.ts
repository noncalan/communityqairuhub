import { createHash, timingSafeEqual } from "node:crypto";

function digest(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export function hasValidCoreAuthorization(
  authorization: string | null,
  expectedApiKey: string,
) {
  if (!authorization?.startsWith("Bearer ")) return false;
  const token = authorization.slice("Bearer ".length);
  if (!token || token.trim() !== token || token.includes(" ")) return false;
  return timingSafeEqual(digest(token), digest(expectedApiKey));
}
