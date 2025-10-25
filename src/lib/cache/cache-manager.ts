import { getRedisClient } from "./redis";

export interface CacheOptions {
	ttl?: number; // Time to live in seconds
	prefix?: string;
}

export class CacheManager {
	private redis = getRedisClient();
	private defaultTTL = 300; // 5 minutes

	async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
		try {
			const fullKey = this.buildKey(key, options?.prefix);
			const value = await this.redis.get(fullKey);
			
			if (!value) return null;
			
			return JSON.parse(value) as T;
		} catch (error) {
			console.error("Cache get error:", error);
			return null;
		}
	}

	async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
		try {
			const fullKey = this.buildKey(key, options?.prefix);
			const ttl = options?.ttl ?? this.defaultTTL;
			
			await this.redis.setEx(fullKey, ttl, JSON.stringify(value));
		} catch (error) {
			console.error("Cache set error:", error);
		}
	}

	async del(key: string, options?: CacheOptions): Promise<void> {
		try {
			const fullKey = this.buildKey(key, options?.prefix);
			await this.redis.del(fullKey);
		} catch (error) {
			console.error("Cache delete error:", error);
		}
	}

	async invalidatePattern(pattern: string): Promise<void> {
		try {
			const keys = await this.redis.keys(pattern);
			if (keys.length > 0) {
				await this.redis.del(keys);
			}
		} catch (error) {
			console.error("Cache pattern invalidation error:", error);
		}
	}

	async invalidateUserCache(userId: string): Promise<void> {
		await this.invalidatePattern(`user:${userId}:*`);
		await this.invalidatePattern(`permissions:${userId}:*`);
	}

	async invalidateKennelCache(kennelId?: string): Promise<void> {
		if (kennelId) {
			await this.invalidatePattern(`kennel:${kennelId}:*`);
		} else {
			await this.invalidatePattern("kennels:*");
		}
	}

	private buildKey(key: string, prefix?: string): string {
		return prefix ? `${prefix}:${key}` : key;
	}
}

export const cacheManager = new CacheManager();

// Cache keys
export const CACHE_KEYS = {
	USER_PERMISSIONS: (userId: string) => `permissions:${userId}`,
	KENNEL_LIST: "kennels:list",
	KENNEL_DETAILS: (kennelId: string) => `kennel:${kennelId}:details`,
	USER_PROFILE: (userId: string) => `user:${userId}:profile`,
	BOOKING_STATS: (userId: string) => `user:${userId}:booking_stats`,
} as const;
