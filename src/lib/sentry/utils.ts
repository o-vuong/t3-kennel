import * as Sentry from "@sentry/nextjs";

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    tags: {
      component: context?.component || "unknown",
    },
    extra: context,
  });
}

export function captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>) {
  Sentry.captureMessage(message, level, {
    tags: {
      component: context?.component || "unknown",
    },
    extra: context,
  });
}

export function setUserContext(user: { id: string; email?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
}

export function clearUserContext() {
  Sentry.setUser(null);
}

export function addBreadcrumb(message: string, category: string, level: "info" | "warning" | "error" = "info", data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
}

export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

export function setContext(key: string, context: Record<string, any>) {
  Sentry.setContext(key, context);
}
