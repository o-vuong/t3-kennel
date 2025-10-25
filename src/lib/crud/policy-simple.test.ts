import { describe, it, expect } from "vitest";
import { 
	bookingEntityPolicy, 
	petEntityPolicy, 
	kennelEntityPolicy,
	getContext 
} from "./entity-policies";
import type { UserRole } from "@prisma/client";

describe("Entity Policies", () => {
	const mockUser = {
		id: "user-1",
		role: "CUSTOMER" as UserRole,
	};

	const mockBooking = {
		id: "booking-1",
		customerId: "user-1",
		petId: "pet-1",
		kennelId: "kennel-1",
		status: "PENDING" as const,
		price: 100,
		startDate: new Date("2024-01-01"),
		endDate: new Date("2024-01-03"),
	};

	const mockPet = {
		id: "pet-1",
		ownerId: "user-1",
		name: "Buddy",
		species: "Dog",
		breed: "Golden Retriever",
		age: 3,
		weight: 25.5,
		medicalNotes: "No known allergies",
	};

	const mockKennel = {
		id: "kennel-1",
		name: "Large Kennel",
		size: "LARGE" as const,
		capacity: 1,
		price: 50,
		amenities: ["Air conditioning", "Outdoor access"],
		status: "AVAILABLE" as const,
	};

	describe("Booking Policy", () => {
		it("should allow customers to create their own bookings", () => {
			const context = getContext(mockUser);
			const result = bookingEntityPolicy.canCreate(context, mockBooking);
			expect(result.allowed).toBe(true);
		});

		it("should allow staff to create bookings", () => {
			const staffUser = { ...mockUser, role: "STAFF" as UserRole };
			const context = getContext(staffUser);
			const result = bookingEntityPolicy.canCreate(context, mockBooking);
			expect(result.allowed).toBe(true);
		});

		it("should allow customers to read their own bookings", () => {
			const context = getContext(mockUser);
			const result = bookingEntityPolicy.canRead(context, mockBooking);
			expect(result.allowed).toBe(true);
		});

		it("should deny customers from reading other customers' bookings", () => {
			const context = getContext(mockUser);
			const otherCustomerBooking = {
				...mockBooking,
				customerId: "other-user",
			};
			const result = bookingEntityPolicy.canRead(context, otherCustomerBooking);
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Insufficient permissions");
		});
	});

	describe("Pet Policy", () => {
		it("should allow customers to create their own pets", () => {
			const context = getContext(mockUser);
			const result = petEntityPolicy.canCreate(context, mockPet);
			expect(result.allowed).toBe(true);
		});

		it("should allow staff to create pets", () => {
			const staffUser = { ...mockUser, role: "STAFF" as UserRole };
			const context = getContext(staffUser);
			const result = petEntityPolicy.canCreate(context, mockPet);
			expect(result.allowed).toBe(true);
		});

		it("should allow customers to read their own pets", () => {
			const context = getContext(mockUser);
			const result = petEntityPolicy.canRead(context, mockPet);
			expect(result.allowed).toBe(true);
		});

		it("should deny customers from reading other customers' pets", () => {
			const context = getContext(mockUser);
			const otherCustomerPet = {
				...mockPet,
				ownerId: "other-user",
			};
			const result = petEntityPolicy.canRead(context, otherCustomerPet);
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Insufficient permissions");
		});
	});

	describe("Kennel Policy", () => {
		it("should allow admin to create kennels", () => {
			const adminUser = { ...mockUser, role: "ADMIN" as UserRole };
			const context = getContext(adminUser);
			const result = kennelEntityPolicy.canCreate(context);
			expect(result.allowed).toBe(true);
		});

		it("should allow owner to create kennels", () => {
			const ownerUser = { ...mockUser, role: "OWNER" as UserRole };
			const context = getContext(ownerUser);
			const result = kennelEntityPolicy.canCreate(context);
			expect(result.allowed).toBe(true);
		});

		it("should deny customers from creating kennels", () => {
			const context = getContext(mockUser);
			const result = kennelEntityPolicy.canCreate(context);
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Only owners or administrators");
		});

		it("should allow all roles to read kennels", () => {
			const roles: UserRole[] = ["CUSTOMER", "STAFF", "ADMIN", "OWNER"];
			
			roles.forEach((role) => {
				const user = { ...mockUser, role };
				const context = getContext(user);
				const result = kennelEntityPolicy.canRead(context, mockKennel);
				expect(result.allowed).toBe(true);
			});
		});

		it("should allow admin to update kennels", () => {
			const adminUser = { ...mockUser, role: "ADMIN" as UserRole };
			const context = getContext(adminUser);
			const result = kennelEntityPolicy.canUpdate(context, mockKennel);
			expect(result.allowed).toBe(true);
		});

		it("should deny customers from updating kennels", () => {
			const context = getContext(mockUser);
			const result = kennelEntityPolicy.canUpdate(context, mockKennel);
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("Only owners or administrators");
		});
	});
});
