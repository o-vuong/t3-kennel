import { createHmac, randomBytes } from "crypto";
import { env } from "~/env";

export function generateOverrideToken(
	issuedBy: string,
	issuedTo: string,
	scope: string,
	entityType: string,
	entityId: string,
	expiresAt: Date,
): { token: string; nonce: string } {
	const nonce = randomBytes(16).toString("hex");
	const payload = {
		nonce,
		scope,
		entityType,
		entityId,
		issuedTo,
		issuedBy,
		expiresAt: expiresAt.toISOString(),
	};

	const signature = createHmac("sha256", env.OVERRIDE_HMAC_SECRET)
		.update(JSON.stringify(payload))
		.digest("hex");

	const token = Buffer.from(
		JSON.stringify({ ...payload, signature }),
	).toString("base64url");

	return { token, nonce };
}

export function verifyOverrideToken(token: string): {
	valid: boolean;
	payload?: any;
} {
	try {
		const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
		const { signature, ...payload } = decoded;

		const expectedSignature = createHmac("sha256", env.OVERRIDE_HMAC_SECRET)
			.update(JSON.stringify(payload))
			.digest("hex");

		if (signature !== expectedSignature) {
			return { valid: false };
		}

		if (new Date(payload.expiresAt) < new Date()) {
			return { valid: false };
		}

		return { valid: true, payload };
	} catch {
		return { valid: false };
	}
}

export function hashToken(token: string): string {
	return createHmac("sha256", env.OVERRIDE_HMAC_SECRET)
		.update(token)
		.digest("hex");
}
