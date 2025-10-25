import { PrismaClient } from "@prisma/client";
import { captureMessage } from "~/lib/sentry/utils";

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
}

const slowQueryThreshold = 500; // 500ms
const queryMetrics: QueryMetrics[] = [];

export function createQueryMonitor(prisma: PrismaClient) {
  // Monitor Prisma queries
  prisma.$use(async (params, next) => {
    const startTime = Date.now();
    const query = `${params.model}.${params.action}`;
    
    try {
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > slowQueryThreshold) {
        captureMessage(
          `Slow database query: ${query} took ${duration}ms`,
          "warning",
          {
            component: "database",
            query,
            duration,
            model: params.model,
            action: params.action,
            args: params.args,
          }
        );
      }
      
      // Store metrics
      queryMetrics.push({
        query,
        duration,
        timestamp: new Date(),
        params: params.args,
      });
      
      // Keep only last 1000 queries
      if (queryMetrics.length > 1000) {
        queryMetrics.shift();
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      captureMessage(
        `Database query failed: ${query} after ${duration}ms`,
        "error",
        {
          component: "database",
          query,
          duration,
          model: params.model,
          action: params.action,
          args: params.args,
          error: error instanceof Error ? error.message : String(error),
        }
      );
      
      throw error;
    }
  });
}

export function getQueryMetrics(): QueryMetrics[] {
  return [...queryMetrics];
}

export function getSlowQueries(threshold: number = slowQueryThreshold): QueryMetrics[] {
  return queryMetrics.filter(metric => metric.duration > threshold);
}

export function getAverageQueryTime(): number {
  if (queryMetrics.length === 0) return 0;
  
  const totalDuration = queryMetrics.reduce((sum, metric) => sum + metric.duration, 0);
  return totalDuration / queryMetrics.length;
}

export function getQueryStats() {
  const totalQueries = queryMetrics.length;
  const slowQueries = getSlowQueries().length;
  const averageTime = getAverageQueryTime();
  
  return {
    totalQueries,
    slowQueries,
    averageTime,
    slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0,
  };
}
