import { describe, it, expect } from "vitest";
import { isMFARequired, isMFAVerifiedRecently } from "./mfa";

describe("MFA Helper Functions", () => {
	describe("isMFARequired", () => {
		it("should require MFA for OWNER role", () => {
			expect(isMFARequired("OWNER")).toBe(true);
		});

		it("should require MFA for ADMIN role", () => {
			expect(isMFARequired("ADMIN")).toBe(true);
		});

		it("should not require MFA for STAFF role", () => {
			expect(isMFARequired("STAFF")).toBe(false);
		});

		it("should not require MFA for CUSTOMER role", () => {
			expect(isMFARequired("CUSTOMER")).toBe(false);
		});
	});

	describe("isMFAVerifiedRecently", () => {
		it("should return true for recent verification", () => {
			const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
			expect(isMFAVerifiedRecently(recentDate)).toBe(true);
		});

		it("should return false for old verification", () => {
			const oldDate = new Date(Date.now() - 13 * 60 * 60 * 1000); // 13 hours ago
			expect(isMFAVerifiedRecently(oldDate)).toBe(false);
		});

		it("should return false for null date", () => {
			expect(isMFAVerifiedRecently(null)).toBe(false);
		});

		it("should respect custom max age", () => {
			const recentDate = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
			expect(isMFAVerifiedRecently(recentDate, 15)).toBe(false); // 15 minutes max
		});

		it("should handle edge case at boundary", () => {
			const boundaryDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // Exactly 12 hours ago
			expect(isMFAVerifiedRecently(boundaryDate)).toBe(true);
		});
	});
});
