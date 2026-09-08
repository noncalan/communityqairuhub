export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "At least one letter",
  "At least one number",
] as const;

export const PASSWORD_REQUIREMENT_SUMMARY =
  "Use at least 8 characters, including at least one letter and one number.";

export function validatePassword(password: string) {
  const errors: string[] = [];

  if (password.length < 8) errors.push(PASSWORD_REQUIREMENTS[0]);
  if (!/[A-Za-z]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[1]);
  if (!/[0-9]/.test(password)) errors.push(PASSWORD_REQUIREMENTS[2]);

  return errors;
}
