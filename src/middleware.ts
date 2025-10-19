import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://api.stripe.com https://checkout.stripe.com https://js.stripe.com https://fonts.googleapis.com https://fonts.gstatic.com wss:",
  "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const PERMISSIONS_POLICY =
  "accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), clipboard-read=(), clipboard-write=(), display-capture=(), fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), xr-spatial-tracking=()";

// Define protected routes and their required roles
const protectedRoutes = {
  "/owner": ["OWNER"],
  "/admin": ["OWNER", "ADMIN"],
  "/staff": ["OWNER", "ADMIN", "STAFF"],
  "/customer": ["OWNER", "ADMIN", "STAFF", "CUSTOMER"],
  "/dashboard": ["OWNER", "ADMIN", "STAFF", "CUSTOMER"],
} as const;

// Routes that don't require authentication
const publicRoutes = ["/login", "/api/auth", "/offline.html", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Handle public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // For now, let all authenticated routes through and handle auth in the app
  // This avoids Edge Runtime issues with Better Auth
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set(
    "Content-Security-Policy",
    CONTENT_SECURITY_POLICY,
  );
  response.headers.set(
    "Permissions-Policy",
    PERMISSIONS_POLICY,
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("Origin-Agent-Cluster", "?1");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
