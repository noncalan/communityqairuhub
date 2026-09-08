import { NextResponse } from "next/server";

export const coreResponseHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export function coreJson(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(coreResponseHeaders)) {
    if (!headers.has(key)) headers.set(key, value);
  }
  return NextResponse.json(data, { ...init, headers });
}

export function coreError(
  status: number,
  code: string,
  message: string,
  details?: Record<string, string>,
) {
  return coreJson(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}
