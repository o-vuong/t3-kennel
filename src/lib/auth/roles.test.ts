import { describe, it, expect } from "vitest";
import {
	ROLE_VALUES,
	ROLE_HOME,
	DEFAULT_HOME_PATH,
	isUserRole,
	resolveRoleHome,
	parseUserRole,
} from "./roles";

describe("Role Functions", () => {
	describe("ROLE_VALUES", () => {
		it("should contain all valid roles", () => {
			expect(ROLE_VALUES).toEqual(["OWNER", "ADMIN", "STAFF", "CUSTOMER"]);
		});
	});

	describe("ROLE_HOME", () => {
		it("should map each role to correct home path", () => {
			expect(ROLE_HOME.OWNER).toBe("/owner/control");
			expect(ROLE_HOME.ADMIN).toBe("/admin/dashboard");
			expect(ROLE_HOME.STAFF).toBe("/staff/overview");
			expect(ROLE_HOME.CUSTOMER).toBe("/customer/home");
		});
	});

	describe("DEFAULT_HOME_PATH", () => {
		it("should be set to login page", () => {
			expect(DEFAULT_HOME_PATH).toBe("/login");
		});
	});

	describe("isUserRole", () => {
		it("should return true for valid roles", () => {
			expect(isUserRole("OWNER")).toBe(true);
			expect(isUserRole("ADMIN")).toBe(true);
			expect(isUserRole("STAFF")).toBe(true);
			expect(isUserRole("CUSTOMER")).toBe(true);
		});

		it("should return false for invalid roles", () => {
			expect(isUserRole("INVALID")).toBe(false);
			expect(isUserRole("")).toBe(false);
			expect(isUserRole(null)).toBe(false);
			expect(isUserRole(undefined)).toBe(false);
			expect(isUserRole(123)).toBe(false);
			expect(isUserRole({})).toBe(false);
		});
	});

	describe("resolveRoleHome", () => {
		it("should return correct home path for each role", () => {
			expect(resolveRoleHome("OWNER")).toBe("/owner/control");
			expect(resolveRoleHome("ADMIN")).toBe("/admin/dashboard");
			expect(resolveRoleHome("STAFF")).toBe("/staff/overview");
			expect(resolveRoleHome("CUSTOMER")).toBe("/customer/home");
		});

		it("should return default path for invalid role", () => {
			// TypeScript would prevent this, but testing runtime behavior
			expect(resolveRoleHome("INVALID" as any)).toBe("/login");
		});
	});

	describe("parseUserRole", () => {
		it("should return role for valid string", () => {
			expect(parseUserRole("OWNER")).toBe("OWNER");
			expect(parseUserRole("ADMIN")).toBe("ADMIN");
			expect(parseUserRole("STAFF")).toBe("STAFF");
			expect(parseUserRole("CUSTOMER")).toBe("CUSTOMER");
		});

		it("should return undefined for invalid input", () => {
			expect(parseUserRole("INVALID")).toBeUndefined();
			expect(parseUserRole("")).toBeUndefined();
			expect(parseUserRole(null)).toBeUndefined();
			expect(parseUserRole(undefined)).toBeUndefined();
			expect(parseUserRole(123)).toBeUndefined();
			expect(parseUserRole({})).toBeUndefined();
		});
	});
});
