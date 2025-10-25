import { NextRequest, NextResponse } from "next/server";
import { captureMessage } from "~/lib/sentry/utils";

interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  method: string;
  path: string;
  statusCode?: number;
  userAgent?: string;
  ip?: string;
}

const slowQueryThreshold = 1000; // 1 second
const performanceMetrics = new Map<string, PerformanceMetrics>();

export function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const path = request.nextUrl.pathname;
  const method = request.method;

  // Store initial metrics
  performanceMetrics.set(requestId, {
    startTime,
    method,
    path,
    userAgent: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
  });

  // Add performance headers
  const response = NextResponse.next();
  response.headers.set("X-Request-ID", requestId);
  response.headers.set("X-Response-Time", "0ms");

  return response;
}

export function trackPerformance(requestId: string, statusCode: number) {
  const metrics = performanceMetrics.get(requestId);
  if (!metrics) return;

  const endTime = Date.now();
  const duration = endTime - metrics.startTime;

  metrics.endTime = endTime;
  metrics.duration = duration;
  metrics.statusCode = statusCode;

  // Log slow queries
  if (duration > slowQueryThreshold) {
    captureMessage(
      `Slow query detected: ${metrics.method} ${metrics.path} took ${duration}ms`,
      "warning",
      {
        component: "performance",
        duration,
        method: metrics.method,
        path: metrics.path,
        statusCode,
        userAgent: metrics.userAgent,
        ip: metrics.ip,
      }
    );
  }

  // Log performance metrics
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: "info",
    message: "Request completed",
    requestId,
    method: metrics.method,
    path: metrics.path,
    duration,
    statusCode,
    userAgent: metrics.userAgent,
    ip: metrics.ip,
  }));

  // Clean up
  performanceMetrics.delete(requestId);
}

export function getPerformanceMetrics(): PerformanceMetrics[] {
  return Array.from(performanceMetrics.values());
}
