import { test, expect } from "@playwright/test";

test.describe("Booking Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to login page
		await page.goto("/login");
		
		// Login as customer
		await page.fill('input[type="email"]', "customer@example.com");
		await page.fill('input[type="password"]', "customer123");
		await page.click('button[type="submit"]');
		
		// Wait for redirect to customer dashboard
		await expect(page).toHaveURL("/customer/home");
	});

	test("should create a new booking", async ({ page }) => {
		// Navigate to new booking page
		await page.click('a[href="/customer/bookings/new"]');
		await expect(page).toHaveURL("/customer/bookings/new");

		// Fill booking form
		await page.selectOption('select[name="petId"]', { label: "Buddy" });
		await page.selectOption('select[name="size"]', { label: "Large" });
		await page.fill('input[name="startDate"]', "2024-12-20");
		await page.fill('input[name="endDate"]', "2024-12-22");
		await page.fill('textarea[name="notes"]', "Special dietary requirements");

		// Submit booking
		await page.click('button[type="submit"]');
		
		// Verify booking was created
		await expect(page.locator("text=Booking created successfully")).toBeVisible();
		await expect(page).toHaveURL("/customer/bookings");
	});

	test("should display booking in list", async ({ page }) => {
		// Navigate to bookings page
		await page.goto("/customer/bookings");
		
		// Verify booking is displayed
		await expect(page.locator("text=Buddy")).toBeVisible();
		await expect(page.locator("text=Large Kennel")).toBeVisible();
		await expect(page.locator("text=Dec 20 - Dec 22")).toBeVisible();
	});

	test("should allow payment processing", async ({ page }) => {
		// Navigate to bookings page
		await page.goto("/customer/bookings");
		
		// Click payment button
		await page.click('button:has-text("Pay")');
		
		// Verify payment modal or redirect
		await expect(page.locator("text=Payment")).toBeVisible();
	});

	test("should allow booking cancellation", async ({ page }) => {
		// Navigate to bookings page
		await page.goto("/customer/bookings");
		
		// Click cancel button
		await page.click('button:has-text("Cancel")');
		
		// Confirm cancellation
		await page.click('button:has-text("Confirm")');
		
		// Verify cancellation
		await expect(page.locator("text=Booking cancelled")).toBeVisible();
	});
});

test.describe("Staff Care Log Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Login as staff
		await page.goto("/login");
		await page.fill('input[type="email"]', "staff@kennel.com");
		await page.fill('input[type="password"]', "staff123");
		await page.click('button[type="submit"]');
		
		// Wait for redirect to staff dashboard
		await expect(page).toHaveURL("/staff/overview");
	});

	test("should add care log entry", async ({ page }) => {
		// Navigate to care logs
		await page.click('a[href="/staff/care-logs"]');
		await expect(page).toHaveURL("/staff/care-logs");

		// Click add care log button
		await page.click('button:has-text("Add Care Log")');
		
		// Fill care log form
		await page.selectOption('select[name="bookingId"]', { label: "Buddy - Dec 20-22" });
		await page.selectOption('select[name="activity"]', { label: "Feeding" });
		await page.fill('textarea[name="notes"]', "Ate all food, good appetite");
		await page.selectOption('select[name="healthStatus"]', { label: "Good" });
		
		// Submit care log
		await page.click('button[type="submit"]');
		
		// Verify care log was added
		await expect(page.locator("text=Care log added successfully")).toBeVisible();
	});

	test("should check in pet", async ({ page }) => {
		// Navigate to bookings
		await page.click('a[href="/staff/bookings"]');
		
		// Find booking and check in
		await page.click('button:has-text("Check In")');
		
		// Verify check-in
		await expect(page.locator("text=Checked in successfully")).toBeVisible();
	});
});

test.describe("Admin Management Flow", () => {
	test.beforeEach(async ({ page }) => {
		// Login as admin
		await page.goto("/login");
		await page.fill('input[type="email"]', "admin@kennel.com");
		await page.fill('input[type="password"]', "admin123");
		await page.click('button[type="submit"]');
		
		// Wait for redirect to admin dashboard
		await expect(page).toHaveURL("/admin/dashboard");
	});

	test("should view booking management", async ({ page }) => {
		// Navigate to booking management
		await page.click('a[href="/admin/bookings"]');
		await expect(page).toHaveURL("/admin/bookings");
		
		// Verify booking list is displayed
		await expect(page.locator("text=All Bookings")).toBeVisible();
		await expect(page.locator("text=John Customer")).toBeVisible();
	});

	test("should process refund", async ({ page }) => {
		// Navigate to booking management
		await page.goto("/admin/bookings");
		
		// Click refund button
		await page.click('button:has-text("Process Refund")');
		
		// Fill refund form
		await page.selectOption('input[name="refundType"][value="full"]');
		await page.fill('input[name="reason"]', "Customer requested cancellation");
		
		// Submit refund
		await page.click('button:has-text("Process Refund")');
		
		// Verify refund was processed
		await expect(page.locator("text=Refund processed successfully")).toBeVisible();
	});
});
