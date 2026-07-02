export type FieldValidationResult = { valid: true } | { valid: false; message: string };

export const validators = {
  name: (value: string) => requiredText(value, "Enter a name.", 2, 80),
  email: (value: string) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? { valid: true } : { valid: false, message: "Enter a valid email address." }),
  password: (value: string) => value.length >= 10 && /[A-Z]/.test(value) && /[0-9]/.test(value) ? { valid: true } : { valid: false, message: "Use at least 10 characters with a number and uppercase letter." },
  phone: (value: string) => !value || /^[+0-9\s-]{7,18}$/.test(value.trim()) ? { valid: true } : { valid: false, message: "Enter a valid phone number." },
  slug: (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim()) ? { valid: true } : { valid: false, message: "Use lowercase letters, numbers, and hyphens only." },
  url: (value: string) => {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? { valid: true } : { valid: false, message: "Use a valid http or https URL." };
    } catch {
      return { valid: false, message: "Enter a valid URL." };
    }
  },
  projectName: (value: string) => requiredText(value, "Enter a project name.", 3, 90),
  description: (value: string) => requiredText(value, "Add a short description.", 10, 5000),
  workspaceName: (value: string) => requiredText(value, "Enter a workspace name.", 2, 80),
  supportSubject: (value: string) => requiredText(value, "Enter a support subject.", 4, 140),
  apiKeyName: (value: string) => requiredText(value, "Enter an API key name.", 3, 80),
  creditAmount: (value: number) => Number.isFinite(value) && value > 0 ? { valid: true } : { valid: false, message: "Enter a valid top-up amount." },
  file: (file: File, options: { maxBytes: number; allowedTypes: string[] }) => {
    if (file.size > options.maxBytes) return { valid: false, message: `File must be ${formatBytes(options.maxBytes)} or smaller.` };
    if (!options.allowedTypes.includes(file.type)) return { valid: false, message: "This file type is not allowed." };
    return { valid: true };
  }
} satisfies Record<string, (...args: any[]) => FieldValidationResult>;

export function collectFieldErrors(fields: Record<string, FieldValidationResult>) {
  return Object.fromEntries(Object.entries(fields).flatMap(([key, result]) => result.valid ? [] : [[key, result.message]]));
}

function requiredText(value: string, message: string, min: number, max: number): FieldValidationResult {
  const trimmed = value.trim();
  if (trimmed.length < min) return { valid: false, message };
  if (trimmed.length > max) return { valid: false, message: `Use ${max} characters or fewer.` };
  return { valid: true };
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}
