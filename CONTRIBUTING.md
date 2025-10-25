# Contributing to Kennel Management System

Thank you for your interest in contributing to the Kennel Management System! This document provides guidelines and information for contributors.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Contributing Process](#contributing-process)
5. [Code Standards](#code-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Security Guidelines](#security-guidelines)
8. [Documentation](#documentation)
9. [Release Process](#release-process)

## Code of Conduct

This project follows a code of conduct that ensures a welcoming environment for all contributors. Please:

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow security best practices
- Respect privacy and confidentiality

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Git 2.30+
- Docker (optional, for containerized development)

### Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/your-username/t3-kennel.git
cd t3-kennel

# Add upstream remote
git remote add upstream https://github.com/original-org/t3-kennel.git
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Copy environment file
cp env.example .env.local

# Set up database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development server
pnpm dev
```

## Contributing Process

### 1. Create a Feature Branch

```bash
# Update your fork
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Follow existing patterns and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure security best practices

### 3. Test Your Changes

```bash
# Run linting
pnpm check

# Run type checking
pnpm typecheck

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run all tests
pnpm test && pnpm test:e2e
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with conventional format
git commit -m "feat: add new feature"
# or
git commit -m "fix: resolve bug in authentication"
# or
git commit -m "docs: update API documentation"
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper types for all functions and variables
- Use interfaces for object shapes
- Prefer type over interface for simple types
- Use generic types where appropriate

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: UserRole;
}

type UserRole = "CUSTOMER" | "STAFF" | "ADMIN" | "OWNER";

// Good
function createUser<T extends User>(user: T): Promise<T> {
  // Implementation
}
```

### Code Style

- Use Biome for formatting and linting
- Follow existing naming conventions
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for public APIs

```typescript
/**
 * Creates a new booking for a pet
 * @param bookingData - The booking information
 * @param session - The user session
 * @returns Promise<Booking> - The created booking
 */
async function createBooking(
  bookingData: CreateBookingInput,
  session: Session
): Promise<Booking> {
  // Implementation
}
```

### File Organization

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin pages
│   ├── customer/          # Customer pages
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/                # Base UI components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication logic
│   ├── crud/              # CRUD operations
│   ├── cache/             # Caching logic
│   └── utils/             # Utility functions
├── server/                # Server-side code
│   ├── api/               # tRPC routers
│   └── db.ts              # Database client
└── styles/                # Global styles
```

## Testing Guidelines

### Unit Tests

- Test individual functions and components
- Mock external dependencies
- Test error conditions
- Aim for high coverage

```typescript
// Example unit test
import { describe, it, expect, vi } from "vitest";
import { createUser } from "~/lib/auth/user";

describe("createUser", () => {
  it("should create a user with valid data", async () => {
    const userData = {
      email: "test@example.com",
      name: "Test User",
      role: "CUSTOMER" as const,
    };

    const result = await createUser(userData);

    expect(result).toMatchObject({
      email: userData.email,
      name: userData.name,
      role: userData.role,
    });
  });

  it("should throw error for invalid email", async () => {
    const userData = {
      email: "invalid-email",
      name: "Test User",
      role: "CUSTOMER" as const,
    };

    await expect(createUser(userData)).rejects.toThrow("Invalid email");
  });
});
```

### Integration Tests

- Test API endpoints
- Test database operations
- Test authentication flows
- Test error handling

```typescript
// Example integration test
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "~/server/api/root";

describe("Booking API", () => {
  it("should create a booking", async () => {
    const caller = appRouter.createCaller({
      session: mockSession,
      db: mockDb,
    });

    const result = await caller.bookings.create({
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-01-20"),
      petId: "pet_123",
      kennelId: "kennel_456",
    });

    expect(result).toMatchObject({
      startDate: new Date("2024-01-15"),
      endDate: new Date("2024-01-20"),
      petId: "pet_123",
      kennelId: "kennel_456",
    });
  });
});
```

### E2E Tests

- Test complete user workflows
- Test critical business processes
- Test offline functionality
- Test payment flows

```typescript
// Example E2E test
import { test, expect } from "@playwright/test";

test("customer can create booking", async ({ page }) => {
  // Login as customer
  await page.goto("/login");
  await page.fill('[data-testid="email"]', "customer@example.com");
  await page.fill('[data-testid="password"]', "password123");
  await page.click('[data-testid="login-button"]');

  // Navigate to booking page
  await page.goto("/customer/bookings");
  await page.click('[data-testid="new-booking-button"]');

  // Fill booking form
  await page.selectOption('[data-testid="pet-select"]', "pet_123");
  await page.selectOption('[data-testid="kennel-select"]', "kennel_456");
  await page.fill('[data-testid="start-date"]', "2024-01-15");
  await page.fill('[data-testid="end-date"]', "2024-01-20");

  // Submit booking
  await page.click('[data-testid="submit-booking"]');

  // Verify booking created
  await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
});
```

## Security Guidelines

### Data Protection

- Never log sensitive data (passwords, tokens, PHI)
- Use encryption for sensitive data at rest
- Implement proper access controls
- Follow HIPAA compliance requirements

```typescript
// Good - Redact sensitive data
const sanitizedUser = {
  ...user,
  password: "[REDACTED]",
  ssn: "[REDACTED]",
  medicalNotes: "[REDACTED]",
};

// Bad - Logging sensitive data
console.log("User data:", user); // Never do this
```

### Authentication

- Implement proper session management
- Use secure cookie settings
- Implement rate limiting
- Validate all inputs

```typescript
// Good - Secure session configuration
const sessionConfig = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 60 * 1000, // 30 minutes
};
```

### Audit Logging

- Log all data modifications
- Include user context
- Log security events
- Maintain audit trail

```typescript
// Good - Audit logging
await auditLog.create({
  action: "CREATE",
  entity: "booking",
  entityId: booking.id,
  actorId: session.user.id,
  changes: { status: "PENDING" },
  ipAddress: request.ip,
  userAgent: request.headers["user-agent"],
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex business logic
- Include examples for common use cases
- Update documentation when changing APIs

```typescript
/**
 * Creates a new booking for a pet
 * @param bookingData - The booking information
 * @param session - The user session
 * @returns Promise<Booking> - The created booking
 * @throws {ValidationError} When booking data is invalid
 * @throws {AuthorizationError} When user lacks permission
 * @example
 * ```typescript
 * const booking = await createBooking({
 *   startDate: new Date("2024-01-15"),
 *   endDate: new Date("2024-01-20"),
 *   petId: "pet_123",
 *   kennelId: "kennel_456"
 * }, session);
 * ```
 */
async function createBooking(
  bookingData: CreateBookingInput,
  session: Session
): Promise<Booking> {
  // Implementation
}
```

### README Updates

- Update README for new features
- Add installation instructions
- Update API documentation
- Include troubleshooting guides

### API Documentation

- Update OpenAPI specification
- Add endpoint examples
- Document authentication requirements
- Include error responses

## Release Process

### Versioning

- Follow semantic versioning (semver)
- Update version in package.json
- Create release notes
- Tag releases in Git

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance testing done
- [ ] Migration scripts tested
- [ ] Rollback plan prepared

### Release Steps

```bash
# Update version
npm version patch  # or minor/major

# Push tags
git push origin main --tags

# Create GitHub release
# Include changelog and migration notes
```

## Getting Help

### Resources

- **Documentation**: Check the docs/ directory
- **Issues**: Search existing issues on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

### Contact

- **Maintainers**: @maintainers
- **Security**: security@kennel.app
- **General**: support@kennel.app

## Recognition

Contributors will be recognized in:

- CONTRIBUTORS.md file
- Release notes
- Project documentation
- Community acknowledgments

Thank you for contributing to the Kennel Management System! Your contributions help make pet care management more efficient and secure.
