export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

export function requireText(value: unknown, field: string): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, errors: { [field]: "Required" } };
  }

  return { ok: true, data: value.trim() };
}

export function mergeErrors(...items: Array<Record<string, string> | undefined>) {
  return Object.assign({}, ...items.filter(Boolean));
}
