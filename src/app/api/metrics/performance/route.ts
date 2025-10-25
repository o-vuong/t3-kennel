import { NextRequest, NextResponse } from "next/server";
import { getQueryStats } from "~/lib/performance/query-monitor";
import { getPerformanceMetrics } from "~/lib/performance/middleware";

export async function GET(request: NextRequest) {
  try {
    const queryStats = getQueryStats();
    const performanceMetrics = getPerformanceMetrics();
    
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        totalQueries: queryStats.totalQueries,
        slowQueries: queryStats.slowQueries,
        averageQueryTime: Math.round(queryStats.averageTime),
        slowQueryPercentage: Math.round(queryStats.slowQueryPercentage * 100) / 100,
      },
      requests: {
        active: performanceMetrics.length,
        averageResponseTime: performanceMetrics.length > 0 
          ? Math.round(performanceMetrics.reduce((sum, metric) => sum + (metric.duration || 0), 0) / performanceMetrics.length)
          : 0,
      },
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
      },
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Failed to get performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to get performance metrics" },
      { status: 500 }
    );
  }
}
