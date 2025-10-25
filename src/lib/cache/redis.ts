import { createClient, RedisClientType } from "redis";
import { env } from "~/env";

let redisClient: RedisClientType | null = null;

export function getRedisClient(): RedisClientType {
	if (!redisClient) {
		redisClient = createClient({
			url: env.REDIS_URL,
			socket: {
				reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
			},
		});

		redisClient.on("error", (err) => {
			console.error("Redis Client Error:", err);
		});

		redisClient.on("connect", () => {
			console.log("Redis Client Connected");
		});

		redisClient.on("ready", () => {
			console.log("Redis Client Ready");
		});

		redisClient.on("end", () => {
			console.log("Redis Client Disconnected");
		});

		// Connect to Redis
		redisClient.connect().catch((err) => {
			console.error("Failed to connect to Redis:", err);
		});
	}

	return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}

// Session storage functions
export class SessionStore {
	private redis: RedisClientType;

	constructor() {
		this.redis = getRedisClient();
	}

	async setSession(sessionId: string, data: any, ttlSeconds: number = 1800): Promise<void> {
		await this.redis.setEx(`session:${sessionId}`, ttlSeconds, JSON.stringify(data));
	}

	async getSession(sessionId: string): Promise<any | null> {
		const data = await this.redis.get(`session:${sessionId}`);
		return data ? JSON.parse(data) : null;
	}

	async deleteSession(sessionId: string): Promise<void> {
		await this.redis.del(`session:${sessionId}`);
	}

	async extendSession(sessionId: string, ttlSeconds: number = 1800): Promise<void> {
		await this.redis.expire(`session:${sessionId}`, ttlSeconds);
	}

	async getAllUserSessions(userId: string): Promise<string[]> {
		const pattern = `session:*`;
		const keys = await this.redis.keys(pattern);
		const userSessions: string[] = [];

		for (const key of keys) {
			const data = await this.redis.get(key);
			if (data) {
				const session = JSON.parse(data);
				if (session.user?.id === userId) {
					userSessions.push(key.replace("session:", ""));
				}
			}
		}

		return userSessions;
	}

	async revokeAllUserSessions(userId: string): Promise<void> {
		const sessions = await this.getAllUserSessions(userId);
		if (sessions.length > 0) {
			await this.redis.del(sessions.map(id => `session:${id}`));
		}
	}
}

// Rate limiting functions
export class RateLimiter {
	private redis: RedisClientType;

	constructor() {
		this.redis = getRedisClient();
	}

	async checkRateLimit(
		key: string,
		limit: number,
		windowMs: number
	): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
		const now = Date.now();
		const windowStart = now - windowMs;
		const pipeline = this.redis.multi();

		// Remove expired entries
		pipeline.zRemRangeByScore(key, 0, windowStart);
		
		// Count current entries
		pipeline.zCard(key);
		
		// Add current request
		pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
		
		// Set expiry
		pipeline.expire(key, Math.ceil(windowMs / 1000));

		const results = await pipeline.exec();
		const currentCount = results?.[1] as number || 0;

		const allowed = currentCount < limit;
		const remaining = Math.max(0, limit - currentCount - 1);
		const resetTime = now + windowMs;

		return { allowed, remaining, resetTime };
	}

	async getRateLimitInfo(key: string): Promise<{ count: number; ttl: number }> {
		const count = await this.redis.zCard(key);
		const ttl = await this.redis.ttl(key);
		return { count, ttl };
	}

	async resetRateLimit(key: string): Promise<void> {
		await this.redis.del(key);
	}
}

// Cache functions
export class CacheStore {
	private redis: RedisClientType;

	constructor() {
		this.redis = getRedisClient();
	}

	async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
		const serialized = JSON.stringify(value);
		if (ttlSeconds) {
			await this.redis.setEx(key, ttlSeconds, serialized);
		} else {
			await this.redis.set(key, serialized);
		}
	}

	async get<T = any>(key: string): Promise<T | null> {
		const data = await this.redis.get(key);
		return data ? JSON.parse(data) : null;
	}

	async delete(key: string): Promise<void> {
		await this.redis.del(key);
	}

	async deletePattern(pattern: string): Promise<void> {
		const keys = await this.redis.keys(pattern);
		if (keys.length > 0) {
			await this.redis.del(keys);
		}
	}

	async exists(key: string): Promise<boolean> {
		const result = await this.redis.exists(key);
		return result === 1;
	}

	async increment(key: string, ttlSeconds?: number): Promise<number> {
		const result = await this.redis.incr(key);
		if (ttlSeconds && result === 1) {
			await this.redis.expire(key, ttlSeconds);
		}
		return result;
	}

	async decrement(key: string): Promise<number> {
		return await this.redis.decr(key);
	}
}

// Health check
export async function checkRedisHealth(): Promise<{ healthy: boolean; latency?: number }> {
	try {
		const start = Date.now();
		await getRedisClient().ping();
		const latency = Date.now() - start;
		return { healthy: true, latency };
	} catch (error) {
		console.error("Redis health check failed:", error);
		return { healthy: false };
	}
}

// Export instances
export const sessionStore = new SessionStore();
export const rateLimiter = new RateLimiter();
export const cacheStore = new CacheStore();
