/**
 * Redact sensitive information from objects for logging and auditing
 * Ensures PHI (Protected Health Information) is not exposed in logs
 */

const PHI_FIELDS = new Set([
  "medicalNotes",
  "vaccinations",
  "phone",
  "address",
  "email",
  "ssn",
  "dateOfBirth",
  "emergencyContact",
  "veterinarianInfo",
  "medications",
  "allergies",
  "behavioralNotes",
  "specialInstructions",
]);

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /auth/i,
  /credential/i,
];

export function redact<T extends Record<string, unknown>>(
  data: T,
  options: { deep?: boolean; preserveIds?: boolean } = {}
): Record<string, unknown> {
  const { deep = true, preserveIds = true } = options;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Preserve IDs if requested
    if (preserveIds && (key.endsWith("Id") || key === "id")) {
      result[key] = value;
      continue;
    }

    // Check if field is explicitly PHI
    if (PHI_FIELDS.has(key)) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Check if field matches sensitive patterns
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      result[key] = "[REDACTED]";
      continue;
    }

    // Handle nested objects
    if (deep && value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redact(value as Record<string, unknown>, options);
      continue;
    }

    // Handle arrays
    if (deep && Array.isArray(value)) {
      result[key] = value.map((item) =>
        item && typeof item === "object"
          ? redact(item as Record<string, unknown>, options)
          : item
      );
      continue;
    }

    // Preserve non-sensitive values
    result[key] = value;
  }

  return result;
}

export function redactPHI<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  return redact(data, { deep: true, preserveIds: true });
}

export function redactForLogging<T extends Record<string, unknown>>(
  data: T
): Record<string, unknown> {
  return redact(data, { deep: true, preserveIds: false });
}