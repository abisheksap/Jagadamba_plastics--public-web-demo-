export const FORM_LIMITS = {
  name: 80,
  phone: 32,
  interest: 100,
  message: 1200,
  business: 120,
  quote: 1200,
} as const;

export const MIN_FORM_FILL_MS = 2_000;
export const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1_000;

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputValidationError";
  }
}

export function cleanText(value: unknown, field: string, max: number, required = true): string {
  if (typeof value !== "string") throw new InputValidationError(`${field} must be text.`);
  const cleaned = value.trim().replace(/\r\n?/g, "\n");
  if (required && !cleaned) throw new InputValidationError(`${field} is required.`);
  if (cleaned.length > max) throw new InputValidationError(`${field} is too long (maximum ${max} characters).`);
  return cleaned;
}

export function cleanPhone(value: unknown): string {
  const phone = cleanText(value, "Phone", FORM_LIMITS.phone);
  if (!/^\+?[0-9][0-9 ()-]*$/.test(phone)) {
    throw new InputValidationError("Enter a valid phone number using digits, spaces, +, - or parentheses.");
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) {
    throw new InputValidationError("Enter a phone number containing 7 to 15 digits.");
  }
  return phone;
}

export function cleanRating(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new InputValidationError("Rating must be a whole number from 1 to 5.");
  }
  return value;
}

export function validatePassphrase(passphrase: string): string | null {
  if (passphrase.length < 12) return "Use at least 12 characters.";
  if (passphrase.length > 128) return "Use no more than 128 characters.";
  const groups = [/[a-z]/.test(passphrase), /[A-Z]/.test(passphrase), /[0-9]/.test(passphrase), /[^A-Za-z0-9]/.test(passphrase)];
  if (groups.filter(Boolean).length < 3) return "Use at least three of: lowercase, uppercase, numbers and symbols.";
  return null;
}

export function isSafeHttpUrl(value: string, allowEmpty = false): boolean {
  if (allowEmpty && !value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function normalizedFingerprintPart(value: string): string {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}
