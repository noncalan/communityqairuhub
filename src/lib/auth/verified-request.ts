export const VERIFIED_USER_ID_HEADER = "x-qairu-verified-user-id";
export const VERIFIED_USER_EMAIL_HEADER = "x-qairu-verified-user-email";

export function clearVerifiedRequestHeaders(headers: Headers) {
  headers.delete(VERIFIED_USER_ID_HEADER);
  headers.delete(VERIFIED_USER_EMAIL_HEADER);
}
