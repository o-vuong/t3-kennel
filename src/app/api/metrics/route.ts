import { env } from "~/env";
import { db } from "~/server/db";
import { getMetrics } from "~/lib/monitoring/metrics-middleware";

export async function GET() {
	const lines: string[] = [];
	
	// Add help comments
	lines.push("# HELP kennel_app_info Application information");
	lines.push("# TYPE kennel_app_info gauge");
	lines.push(`kennel_app_info{version="${process.env.GIT_SHA ?? "dev"}",environment="${env.NODE_ENV}"} 1`);
	lines.push("");

	// System metrics
	const memUsage = process.memoryUsage();
	const uptime = process.uptime();
	
	lines.push("# HELP kennel_app_memory_rss_mb Resident Set Size memory usage in MB");
	lines.push("# TYPE kennel_app_memory_rss_mb gauge");
	lines.push(`kennel_app_memory_rss_mb ${Math.round(memUsage.rss / 1024 / 1024)}`);
	lines.push("");

	lines.push("# HELP kennel_app_memory_heap_total_mb Total heap memory allocated in MB");
	lines.push("# TYPE kennel_app_memory_heap_total_mb gauge");
	lines.push(`kennel_app_memory_heap_total_mb ${Math.round(memUsage.heapTotal / 1024 / 1024)}`);
	lines.push("");

	lines.push("# HELP kennel_app_memory_heap_used_mb Used heap memory in MB");
	lines.push("# TYPE kennel_app_memory_heap_used_mb gauge");
	lines.push(`kennel_app_memory_heap_used_mb ${Math.round(memUsage.heapUsed / 1024 / 1024)}`);
	lines.push("");

	lines.push("# HELP kennel_app_memory_external_mb External memory in MB");
	lines.push("# TYPE kennel_app_memory_external_mb gauge");
	lines.push(`kennel_app_memory_external_mb ${Math.round(memUsage.external / 1024 / 1024)}`);
	lines.push("");

	lines.push("# HELP kennel_app_uptime_seconds Application uptime in seconds");
	lines.push("# TYPE kennel_app_uptime_seconds gauge");
	lines.push(`kennel_app_uptime_seconds ${Math.round(uptime)}`);
	lines.push("");

	// Database metrics
	try {
		const dbStart = Date.now();
		await db.$queryRaw`SELECT 1`;
		const dbResponseTime = Date.now() - dbStart;
		
		lines.push("# HELP kennel_app_database_response_time_ms Database response time in milliseconds");
		lines.push("# TYPE kennel_app_database_response_time_ms gauge");
		lines.push(`kennel_app_database_response_time_ms ${dbResponseTime}`);
		lines.push("");
	} catch (error) {
		lines.push("# HELP kennel_app_database_errors_total Database errors total");
		lines.push("# TYPE kennel_app_database_errors_total counter");
		lines.push(`kennel_app_database_errors_total 1`);
		lines.push("");
	}
	
	// Redis metrics (if configured)
	if (env.REDIS_URL) {
		try {
			const { getRedisClient } = await import("~/lib/cache/redis");
			const redis = getRedisClient();
			const redisStart = Date.now();
			await redis.ping();
			const redisResponseTime = Date.now() - redisStart;
			
			lines.push("# HELP kennel_app_redis_response_time_ms Redis response time in milliseconds");
			lines.push("# TYPE kennel_app_redis_response_time_ms gauge");
			lines.push(`kennel_app_redis_response_time_ms ${redisResponseTime}`);
			lines.push("");
		} catch (error) {
			lines.push("# HELP kennel_app_redis_errors_total Redis errors total");
			lines.push("# TYPE kennel_app_redis_errors_total counter");
			lines.push(`kennel_app_redis_errors_total 1`);
			lines.push("");
		}
	}
	
	// Application metrics
	lines.push("# HELP kennel_app_node_version Node.js version");
	lines.push("# TYPE kennel_app_node_version gauge");
	lines.push(`kennel_app_node_version ${parseFloat(process.version.slice(1))}`);
	lines.push("");

	lines.push("# HELP kennel_app_platform Platform identifier");
	lines.push("# TYPE kennel_app_platform gauge");
	lines.push(`kennel_app_platform{platform="${process.platform}"} 1`);
	lines.push("");

	// Request metrics from middleware
	const metrics = getMetrics();
	
	// Request counts
	lines.push("# HELP kennel_app_requests_total Total number of requests");
	lines.push("# TYPE kennel_app_requests_total counter");
	for (const [endpoint, count] of Object.entries(metrics.requestCounts)) {
		lines.push(`kennel_app_requests_total{endpoint="${endpoint}"} ${count}`);
	}
	lines.push("");

	// Response times
	lines.push("# HELP kennel_app_response_times_histogram Response time histogram");
	lines.push("# TYPE kennel_app_response_times_histogram histogram");
	for (const [endpoint, times] of Object.entries(metrics.responseTimes)) {
		if (times.length > 0) {
			const sorted = [...times].sort((a, b) => a - b);
			const count = times.length;
			const sum = times.reduce((a, b) => a + b, 0);
			
			// Calculate buckets
			const buckets = [10, 50, 100, 200, 500, 1000, 2000, 5000];
			const bucketCounts: Record<number, number> = {};
			let cumulativeCount = 0;
			
			for (const bucket of buckets) {
				const bucketCount = sorted.filter(t => t <= bucket).length - cumulativeCount;
				bucketCounts[bucket] = bucketCount;
				cumulativeCount += bucketCount;
			}
			
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="10"} ${bucketCounts[10] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="50"} ${bucketCounts[50] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="100"} ${bucketCounts[100] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="200"} ${bucketCounts[200] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="500"} ${bucketCounts[500] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="1000"} ${bucketCounts[1000] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="2000"} ${bucketCounts[2000] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="5000"} ${bucketCounts[5000] || 0}`);
			lines.push(`kennel_app_response_times_histogram_bucket{endpoint="${endpoint}",le="+Inf"} ${count}`);
			lines.push(`kennel_app_response_times_histogram_sum{endpoint="${endpoint}"} ${sum}`);
			lines.push(`kennel_app_response_times_histogram_count{endpoint="${endpoint}"} ${count}`);
		}
	}
	lines.push("");

	// Error counts
	lines.push("# HELP kennel_app_errors_total Total number of errors by status code");
	lines.push("# TYPE kennel_app_errors_total counter");
	for (const [endpoint, count] of Object.entries(metrics.errorCounts)) {
		lines.push(`kennel_app_errors_total{endpoint="${endpoint}"} ${count}`);
	}
	lines.push("");

	const prometheusOutput = lines.join("\n");
	
	return new Response(prometheusOutput, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "no-cache, no-store, must-revalidate",
		},
	});
}
