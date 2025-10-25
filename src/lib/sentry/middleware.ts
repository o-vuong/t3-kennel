import * as Sentry from "@sentry/nextjs";
import { NextRequest, NextResponse } from "next/server";

export function sentryMiddleware(request: NextRequest) {
  // Add breadcrumb for navigation
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated to ${request.nextUrl.pathname}`,
    level: "info",
    data: {
      url: request.nextUrl.href,
      method: request.method,
    },
  });

  // Add breadcrumb for API calls
  if (request.nextUrl.pathname.startsWith("/api/")) {
    Sentry.addBreadcrumb({
      category: "http",
      message: `API call to ${request.nextUrl.pathname}`,
      level: "info",
      data: {
        url: request.nextUrl.href,
        method: request.method,
        userAgent: request.headers.get("user-agent"),
      },
    });
  }

  // Add breadcrumb for authentication
  if (request.nextUrl.pathname.includes("/login") || request.nextUrl.pathname.includes("/auth")) {
    Sentry.addBreadcrumb({
      category: "auth",
      message: `Authentication attempt at ${request.nextUrl.pathname}`,
      level: "info",
      data: {
        url: request.nextUrl.href,
        method: request.method,
      },
    });
  }

  return NextResponse.next();
}
