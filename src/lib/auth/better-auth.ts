import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "~/server/db";
import { env } from "~/env";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  
  // Session configuration - 30 minute idle timeout
  session: {
    expiresIn: 60 * 30, // 30 minutes
    updateAge: 60 * 15, // Update session every 15 minutes
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Security headers and cookie settings
  advanced: {
    cookiePrefix: "__Secure-",
    crossSubDomainCookies: {
      enabled: false,
    },
    generateId: () => crypto.randomUUID(),
  },

  // Email provider for MFA and notifications
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // User model configuration
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "CUSTOMER",
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
