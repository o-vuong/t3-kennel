import { NextRequest, NextResponse } from "next/server";
import { appLogger } from "./logger";

export function requestIdMiddleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const userId = request.headers.get("x-user-id");
  const sessionId = request.headers.get("x-session-id");
  
  // Log request start
  appLogger.logRequest(request, requestId, userId || undefined, sessionId || undefined);
  
  // Add request ID to response headers
  const response = NextResponse.next();
  response.headers.set("X-Request-ID", requestId);
  
  return response;
}

export function getRequestId(request: NextRequest): string {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}
