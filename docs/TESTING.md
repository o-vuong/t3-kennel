# Testing Guide

This document provides comprehensive testing guidelines for the Kennel Management System.

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Security Testing](#security-testing)
7. [Performance Testing](#performance-testing)
8. [Test Data Management](#test-data-management)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

## Overview

The Kennel Management System uses a comprehensive testing strategy to ensure reliability, security, and compliance with HIPAA requirements.

### Testing Pyramid

```
    /\
   /  \
  / E2E \     ← End-to-End Tests (Playwright)
 /______\
/        \
/Integration\ ← Integration Tests (Vitest)
/____________\
/              \
/   Unit Tests   \ ← Unit Tests (Vitest)
/________________\
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical business logic
- **E2E Tests**: Critical user journeys
- **Security Tests**: All security features
- **Performance Tests**: Key performance metrics

## Testing Strategy

### Test Types

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database operations
3. **E2E Tests**: Complete user workflows
4. **Security Tests**: Authentication, authorization, and data protection
5. **Performance Tests**: Load testing and optimization

### Testing Tools

- **Vitest**: Unit and integration testing
- **Playwright**: End-to-end testing
- **Testing Library**: Component testing utilities
- **MSW**: API mocking
- **Prisma Mock**: Database mocking

## Unit Testing

### Setup

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
    },
  },
});
```

### Test Structure

```typescript
// src/lib/auth/user.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createUser, validateUser } from '~/lib/auth/user';

describe('User Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      const result = await createUser(userData);

      expect(result).toMatchObject({
        email: userData.email,
        name: userData.name,
        role: userData.role,
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      await expect(createUser(userData)).rejects.toThrow('Invalid email');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      await expect(createUser(userData)).rejects.toThrow('Email already exists');
    });
  });

  describe('validateUser', () => {
    it('should validate user data correctly', () => {
      const validUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CUSTOMER' as const,
      };

      expect(validateUser(validUser)).toBe(true);
    });

    it('should reject invalid user data', () => {
      const invalidUser = {
        email: 'invalid-email',
        name: '',
        role: 'INVALID' as any,
      };

      expect(() => validateUser(invalidUser)).toThrow();
    });
  });
});
```

### Component Testing

```typescript
// src/components/forms/booking-form.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingForm } from '~/components/forms/booking-form';

describe('BookingForm', () => {
  it('should render form fields', () => {
    render(<BookingForm onSubmit={vi.fn()} />);

    expect(screen.getByLabelText('Pet')).toBeInTheDocument();
    expect(screen.getByLabelText('Kennel')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<BookingForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Pet'), { target: { value: 'pet_123' } });
    fireEvent.change(screen.getByLabelText('Kennel'), { target: { value: 'kennel_456' } });
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2024-01-15' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-01-20' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create Booking' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        petId: 'pet_123',
        kennelId: 'kennel_456',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
      });
    });
  });

  it('should show validation errors', async () => {
    render(<BookingForm onSubmit={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Booking' }));

    await waitFor(() => {
      expect(screen.getByText('Pet is required')).toBeInTheDocument();
      expect(screen.getByText('Kennel is required')).toBeInTheDocument();
    });
  });
});
```

## Integration Testing

### API Testing

```typescript
// src/server/api/routers/bookings.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appRouter } from '~/server/api/root';
import { createMockContext } from '~/test/mocks';

describe('Booking API', () => {
  let mockContext: any;

  beforeEach(() => {
    mockContext = createMockContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a booking', async () => {
      const bookingData = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        petId: 'pet_123',
        kennelId: 'kennel_456',
      };

      const result = await appRouter
        .createCaller(mockContext)
        .bookings.create(bookingData);

      expect(result).toMatchObject({
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        petId: bookingData.petId,
        kennelId: bookingData.kennelId,
        status: 'PENDING',
      });
    });

    it('should throw error for invalid dates', async () => {
      const bookingData = {
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-01-15'), // End before start
        petId: 'pet_123',
        kennelId: 'kennel_456',
      };

      await expect(
        appRouter.createCaller(mockContext).bookings.create(bookingData)
      ).rejects.toThrow('End date must be after start date');
    });

    it('should throw error for unauthorized user', async () => {
      const bookingData = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        petId: 'pet_123',
        kennelId: 'kennel_456',
      };

      mockContext.session = null;

      await expect(
        appRouter.createCaller(mockContext).bookings.create(bookingData)
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('list', () => {
    it('should list user bookings', async () => {
      const result = await appRouter
        .createCaller(mockContext)
        .bookings.list({ page: 1, limit: 10 });

      expect(result).toMatchObject({
        bookings: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
      });
    });

    it('should filter bookings by status', async () => {
      const result = await appRouter
        .createCaller(mockContext)
        .bookings.list({ 
          page: 1, 
          limit: 10, 
          status: 'PENDING' 
        });

      expect(result.bookings).toHaveLength(2);
      expect(result.bookings.every(b => b.status === 'PENDING')).toBe(true);
    });
  });
});
```

### Database Testing

```typescript
// src/lib/crud/factory.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { CrudFactory } from '~/lib/crud/factory';
import { createMockDb } from '~/test/mocks';

describe('CrudFactory', () => {
  let mockDb: any;
  let factory: CrudFactory;

  beforeEach(() => {
    mockDb = createMockDb();
    factory = new CrudFactory(mockDb, 'booking', 'CREATE', bookingPolicy);
  });

  describe('create', () => {
    it('should create entity with audit log', async () => {
      const data = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        petId: 'pet_123',
        kennelId: 'kennel_456',
      };

      const result = await factory.create(mockSession, data);

      expect(result.success).toBe(true);
      expect(mockDb.booking.create).toHaveBeenCalledWith({
        data: expect.objectContaining(data),
      });
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE',
          entity: 'booking',
          actorId: mockSession.user.id,
        }),
      });
    });

    it('should redact sensitive fields', async () => {
      const data = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-20'),
        petId: 'pet_123',
        kennelId: 'kennel_456',
        paymentInfo: 'sensitive-data',
      };

      const result = await factory.create(mockSession, data);

      expect(result.success).toBe(true);
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: expect.not.objectContaining({
            paymentInfo: 'sensitive-data',
          }),
        }),
      });
    });
  });
});
```

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// src/test/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'customer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/customer/dashboard');
  });

  test('customer can create booking', async ({ page }) => {
    // Navigate to booking page
    await page.goto('/customer/bookings');
    await page.click('[data-testid="new-booking-button"]');

    // Fill booking form
    await page.selectOption('[data-testid="pet-select"]', 'pet_123');
    await page.selectOption('[data-testid="kennel-select"]', 'kennel_456');
    await page.fill('[data-testid="start-date"]', '2024-01-15');
    await page.fill('[data-testid="end-date"]', '2024-01-20');

    // Submit booking
    await page.click('[data-testid="submit-booking"]');

    // Verify booking created
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toContainText('booking_');
  });

  test('customer can view booking details', async ({ page }) => {
    // Navigate to booking details
    await page.goto('/customer/bookings/booking_123');

    // Verify booking information
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('PENDING');
    await expect(page.locator('[data-testid="pet-name"]')).toContainText('Buddy');
    await expect(page.locator('[data-testid="kennel-name"]')).toContainText('Standard Kennel');
  });

  test('customer can cancel booking', async ({ page }) => {
    // Navigate to booking details
    await page.goto('/customer/bookings/booking_123');

    // Cancel booking
    await page.click('[data-testid="cancel-booking"]');
    await page.click('[data-testid="confirm-cancel"]');

    // Verify cancellation
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('CANCELLED');
  });
});

test.describe('Staff Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'staff@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/staff/dashboard');
  });

  test('staff can check in pet', async ({ page }) => {
    // Navigate to booking
    await page.goto('/staff/bookings/booking_123');

    // Check in pet
    await page.click('[data-testid="check-in-button"]');
    await page.fill('[data-testid="check-in-notes"]', 'Pet arrived safely');
    await page.click('[data-testid="confirm-check-in"]');

    // Verify check-in
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('CHECKED_IN');
  });

  test('staff can add care log', async ({ page }) => {
    // Navigate to booking
    await page.goto('/staff/bookings/booking_123');

    // Add care log
    await page.click('[data-testid="add-care-log"]');
    await page.fill('[data-testid="care-activity"]', 'Feeding');
    await page.fill('[data-testid="care-notes"]', 'Ate all food, good appetite');
    await page.click('[data-testid="submit-care-log"]');

    // Verify care log added
    await expect(page.locator('[data-testid="care-log-entry"]')).toContainText('Feeding');
  });
});
```

## Security Testing

### Authentication Testing

```typescript
// src/test/security/auth.test.ts
import { describe, it, expect } from 'vitest';
import { testAuthFlow } from '~/test/security/auth-helpers';

describe('Authentication Security', () => {
  it('should prevent brute force attacks', async () => {
    const attempts = Array(10).fill(null).map(() => 
      testAuthFlow('user@example.com', 'wrong-password')
    );

    const results = await Promise.allSettled(attempts);
    
    // All attempts should fail
    expect(results.every(r => r.status === 'rejected')).toBe(true);
  });

  it('should enforce MFA for admin users', async () => {
    const result = await testAuthFlow('admin@example.com', 'password123');
    
    expect(result.requiresMFA).toBe(true);
    expect(result.mfaMethods).toContain('totp');
    expect(result.mfaMethods).toContain('webauthn');
  });

  it('should validate session tokens', async () => {
    const invalidToken = 'invalid-token';
    
    await expect(
      validateSession(invalidToken)
    ).rejects.toThrow('Invalid session token');
  });
});
```

### Authorization Testing

```typescript
// src/test/security/authorization.test.ts
import { describe, it, expect } from 'vitest';
import { testAuthorization } from '~/test/security/auth-helpers';

describe('Authorization Security', () => {
  it('should prevent customer from accessing admin routes', async () => {
    const customerSession = await createCustomerSession();
    
    await expect(
      testAuthorization(customerSession, '/admin/users')
    ).rejects.toThrow('Forbidden');
  });

  it('should allow admin to access admin routes', async () => {
    const adminSession = await createAdminSession();
    
    const result = await testAuthorization(adminSession, '/admin/users');
    expect(result.allowed).toBe(true);
  });

  it('should enforce data access controls', async () => {
    const customerSession = await createCustomerSession();
    
    // Customer can only access their own data
    await expect(
      testAuthorization(customerSession, '/api/users/other-customer')
    ).rejects.toThrow('Forbidden');
  });
});
```

## Performance Testing

### Load Testing

```typescript
// src/test/performance/load.test.ts
import { describe, it, expect } from 'vitest';
import { createLoadTest } from '~/test/performance/load-helpers';

describe('Performance Tests', () => {
  it('should handle concurrent bookings', async () => {
    const loadTest = createLoadTest({
      endpoint: '/api/trpc/bookings.create',
      concurrency: 100,
      duration: 30000, // 30 seconds
    });

    const results = await loadTest.run();

    expect(results.successRate).toBeGreaterThan(0.95);
    expect(results.averageResponseTime).toBeLessThan(1000); // 1 second
    expect(results.errorRate).toBeLessThan(0.05);
  });

  it('should handle database connection pool', async () => {
    const dbTest = createLoadTest({
      endpoint: '/api/trpc/kennels.list',
      concurrency: 50,
      duration: 60000, // 1 minute
    });

    const results = await dbTest.run();

    expect(results.databaseConnections).toBeLessThan(20);
    expect(results.databaseErrors).toBe(0);
  });
});
```

## Test Data Management

### Test Database Setup

```typescript
// src/test/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createTestDb } from '~/test/database/test-db';

let testDb: any;

beforeAll(async () => {
  testDb = await createTestDb();
  await testDb.seed();
});

afterAll(async () => {
  await testDb.cleanup();
});

beforeEach(async () => {
  await testDb.reset();
});
```

### Mock Data

```typescript
// src/test/mocks/index.ts
export const mockUsers = {
  customer: {
    id: 'user_123',
    email: 'customer@example.com',
    name: 'John Customer',
    role: 'CUSTOMER',
  },
  staff: {
    id: 'user_456',
    email: 'staff@example.com',
    name: 'Jane Staff',
    role: 'STAFF',
  },
  admin: {
    id: 'user_789',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
};

export const mockPets = {
  dog: {
    id: 'pet_123',
    name: 'Buddy',
    species: 'Dog',
    breed: 'Golden Retriever',
    age: 3,
    weight: 70,
    ownerId: 'user_123',
  },
};

export const mockKennels = {
  standard: {
    id: 'kennel_456',
    name: 'Standard Kennel',
    capacity: 1,
    price: 5000,
    amenities: ['Food', 'Water', 'Exercise'],
    isActive: true,
  },
};
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run unit tests
        run: pnpm test
        
      - name: Run E2E tests
        run: pnpm test:e2e
        
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: test-results/
```

## Best Practices

### Test Organization

- **Group related tests**: Use `describe` blocks for logical grouping
- **Clear test names**: Use descriptive test names that explain the scenario
- **One assertion per test**: Focus on testing one thing at a time
- **Arrange-Act-Assert**: Structure tests with clear sections

### Test Data

- **Use factories**: Create test data with factory functions
- **Clean up**: Always clean up test data after tests
- **Isolation**: Ensure tests don't depend on each other
- **Realistic data**: Use realistic test data that reflects production

### Assertions

- **Specific assertions**: Use specific assertions rather than generic ones
- **Error messages**: Include helpful error messages in assertions
- **Async handling**: Properly handle async operations in tests
- **Timeout handling**: Set appropriate timeouts for long-running tests

### Maintenance

- **Regular updates**: Keep test dependencies updated
- **Refactoring**: Refactor tests when code changes
- **Documentation**: Document complex test scenarios
- **Performance**: Monitor test performance and optimize as needed

## Conclusion

This testing guide provides a comprehensive approach to testing the Kennel Management System. By following these guidelines, we ensure the system is reliable, secure, and compliant with HIPAA requirements.

Regular review and updates of testing practices ensure the system maintains high quality and reliability as it evolves.
