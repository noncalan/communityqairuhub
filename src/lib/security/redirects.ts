const unsafeRedirectCharacters = /[\\\u0000-\u001f\u007f]/;
const encodedUnsafeRedirectCharacters = /%(?:0[0-9a-f]|1[0-9a-f]|2f|5c|7f)/i;

export function safeInternalPath(
  value: string | null | undefined,
  origin: string,
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    unsafeRedirectCharacters.test(value) ||
    encodedUnsafeRedirectCharacters.test(value)
  ) {
    return null;
  }

  try {
    const destination = new URL(value, origin);
    if (destination.origin !== origin) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
}
