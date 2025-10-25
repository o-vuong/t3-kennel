import { NextRequest } from "next/server";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  component?: string;
  service?: string;
  duration?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

class Logger {
  private service: string;
  private component?: string;

  constructor(service: string, component?: string) {
    this.service = service;
    this.component = component;
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      component: this.component,
      ...metadata,
    };
  }

  private writeLog(entry: LogEntry): void {
    // In production, you might want to send logs to a log aggregation service
    // For now, we'll write to console in JSON format
    console.log(JSON.stringify(entry));
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.writeLog(this.formatLog("debug", message, metadata));
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.writeLog(this.formatLog("info", message, metadata));
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.writeLog(this.formatLog("warn", message, metadata));
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const logEntry = this.formatLog("error", message, metadata);
    
    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    this.writeLog(logEntry);
  }

  // Request-specific logging
  logRequest(request: NextRequest, requestId: string, userId?: string, sessionId?: string): void {
    this.info("Request started", {
      requestId,
      userId,
      sessionId,
      method: request.method,
      path: request.nextUrl.pathname,
      userAgent: request.headers.get("user-agent"),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    });
  }

  logResponse(requestId: string, statusCode: number, duration: number, userId?: string): void {
    this.info("Request completed", {
      requestId,
      statusCode,
      duration,
      userId,
    });
  }

  logError(requestId: string, error: Error, userId?: string): void {
    this.error("Request failed", error, {
      requestId,
      userId,
    });
  }

  // Business logic logging
  logUserAction(action: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...metadata,
    });
  }

  logSecurityEvent(event: string, userId?: string, metadata?: Record<string, any>): void {
    this.warn(`Security event: ${event}`, {
      userId,
      event,
      ...metadata,
    });
  }

  logAuditEvent(action: string, target: string, targetId: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`Audit: ${action}`, {
      userId,
      action,
      target,
      targetId,
      ...metadata,
    });
  }
}

// Create logger instances for different components
export const appLogger = new Logger("kennel-app");
export const authLogger = new Logger("kennel-app", "auth");
export const dbLogger = new Logger("kennel-app", "database");
export const paymentLogger = new Logger("kennel-app", "payment");
export const notificationLogger = new Logger("kennel-app", "notification");
export const securityLogger = new Logger("kennel-app", "security");
export const auditLogger = new Logger("kennel-app", "audit");
