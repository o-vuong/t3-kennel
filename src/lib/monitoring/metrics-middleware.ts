import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple in-memory metrics store
class MetricsStore {
	private static instance: MetricsStore;
	public requestCounts: Map<string, number> = new Map();
	public responseTimes: Map<string, number[]> = new Map();
	public errorCounts: Map<string, number> = new Map();

	static getInstance(): MetricsStore {
		if (!MetricsStore.instance) {
			MetricsStore.instance = new MetricsStore();
		}
		return MetricsStore.instance;
	}

	incrementRequestCount(endpoint: string, method: string): void {
		const key = `${method}:${endpoint}`;
		const current = this.requestCounts.get(key) || 0;
		this.requestCounts.set(key, current + 1);
	}

	recordResponseTime(endpoint: string, method: string, responseTime: number): void {
		const key = `${method}:${endpoint}`;
		const times = this.responseTimes.get(key) || [];
		times.push(responseTime);
		// Keep only last 100 response times to prevent memory leaks
		if (times.length > 100) {
			times.shift();
		}
		this.responseTimes.set(key, times);
	}

	incrementErrorCount(endpoint: string, method: string, statusCode: number): void {
		const key = `${method}:${endpoint}:${statusCode}`;
		const current = this.errorCounts.get(key) || 0;
		this.errorCounts.set(key, current + 1);
	}

	getMetrics() {
		return {
			requestCounts: Object.fromEntries(this.requestCounts),
			responseTimes: Object.fromEntries(this.responseTimes),
			errorCounts: Object.fromEntries(this.errorCounts),
		};
	}

	// Calculate average response time for an endpoint
	getAverageResponseTime(endpoint: string, method: string): number {
		const key = `${method}:${endpoint}`;
		const times = this.responseTimes.get(key) || [];
		if (times.length === 0) return 0;
		return times.reduce((a, b) => a + b, 0) / times.length;
	}

	// Get response time percentiles
	getResponseTimePercentiles(endpoint: string, method: string): Record<string, number> {
		const key = `${method}:${endpoint}`;
		const times = this.responseTimes.get(key) || [];
		if (times.length === 0) return {};

		const sorted = [...times].sort((a, b) => a - b);
		const len = sorted.length;

		return {
			p50: sorted[Math.floor(len * 0.5)] || 0,
			p90: sorted[Math.floor(len * 0.9)] || 0,
			p95: sorted[Math.floor(len * 0.95)] || 0,
			p99: sorted[Math.floor(len * 0.99)] || 0,
		};
	}
}

export function metricsMiddleware(request: NextRequest) {
	const startTime = Date.now();
	const metrics = MetricsStore.getInstance();
	
	// Extract endpoint and method
	const url = new URL(request.url);
	const endpoint = url.pathname;
	const method = request.method;

	// Increment request count
	metrics.incrementRequestCount(endpoint, method);

	// Return a function that will be called with the response
	return (response: NextResponse) => {
		const responseTime = Date.now() - startTime;
		
		// Record response time
		metrics.recordResponseTime(endpoint, method, responseTime);
		
		// Record error if status >= 400
		if (response.status >= 400) {
			metrics.incrementErrorCount(endpoint, method, response.status);
		}

	// Add custom headers with metrics
	response.headers.set('X-Response-Time', responseTime.toString());
	response.headers.set('X-Request-Count', (metrics.requestCounts.get(`${method}:${endpoint}`) || 0).toString());
		
		return response;
	};
}

export function getMetrics() {
	return MetricsStore.getInstance().getMetrics();
}

export function getEndpointMetrics(endpoint: string, method: string) {
	const metrics = MetricsStore.getInstance();
	return {
		requestCount: metrics.requestCounts.get(`${method}:${endpoint}`) || 0,
		averageResponseTime: metrics.getAverageResponseTime(endpoint, method),
		responseTimePercentiles: metrics.getResponseTimePercentiles(endpoint, method),
		errorCount: Array.from(metrics.errorCounts.entries())
			.filter(([key]) => key.startsWith(`${method}:${endpoint}:`))
			.reduce((sum, [, count]) => sum + count, 0),
	};
}
