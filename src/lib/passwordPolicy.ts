// The rule for a NEW password. The server enforces the same rule; this only lets the form say so
// before the request is sent. Signing in never applies it, so older, shorter passwords still work.

export const PASSWORD_HINT = "At least 8 characters, with a letter and a number";

/** A sentence describing what is wrong with the password, or null if it is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters long.";
  if (password.length > 128) return "Password must be at most 128 characters long.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Password must include at least one letter and one number.";
  return null;
}
