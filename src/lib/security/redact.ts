export function redactPHI(data: Record<string, unknown>): Record<string, unknown> {
	// Redact sensitive fields: medicalNotes, vaccinations, phone, address
	// Keep only IDs and non-PHI metadata for logs
	const redacted = { ...data };
	
	const phiFields = [
		"medicalNotes",
		"vaccinations", 
		"phone",
		"address",
		"email",
		"name",
		"breed",
		"weight",
		"age",
		"notes",
		"message",
		"body",
		"content",
	];
	
	for (const field of phiFields) {
		if (field in redacted) {
			redacted[field] = "[REDACTED]";
		}
	}
	
	return redacted;
}

export function redactForLogs(data: Record<string, unknown>): Record<string, unknown> {
	// More aggressive redaction for audit logs
	const redacted = redactPHI(data);
	
	// Remove nested objects that might contain PHI
	for (const [key, value] of Object.entries(redacted)) {
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			redacted[key] = "[OBJECT_REDACTED]";
		}
	}
	
	return redacted;
}
