import { db } from "~/server/db";
import { cacheManager, CACHE_KEYS } from "./cache-manager";

export interface CachedKennel {
	id: string;
	name: string;
	description: string | null;
	capacity: number;
	pricePerDay: number;
	amenities: string[];
	images: string[];
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export class KennelCacheService {
	async getKennelList(): Promise<CachedKennel[]> {
		// Try cache first
		const cached = await cacheManager.get<CachedKennel[]>(CACHE_KEYS.KENNEL_LIST, {
			ttl: 600, // 10 minutes
		});

		if (cached) {
			return cached;
		}

		// Fetch from database
		const kennels = await db.kennel.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				description: true,
				capacity: true,
				pricePerDay: true,
				amenities: true,
				images: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: { name: "asc" },
		});

		// Cache the result
		await cacheManager.set(CACHE_KEYS.KENNEL_LIST, kennels, {
			ttl: 600, // 10 minutes
		});

		return kennels;
	}

	async getKennelDetails(kennelId: string): Promise<CachedKennel | null> {
		// Try cache first
		const cached = await cacheManager.get<CachedKennel>(
			CACHE_KEYS.KENNEL_DETAILS(kennelId),
			{ ttl: 300 } // 5 minutes
		);

		if (cached) {
			return cached;
		}

		// Fetch from database
		const kennel = await db.kennel.findUnique({
			where: { id: kennelId },
			select: {
				id: true,
				name: true,
				description: true,
				capacity: true,
				pricePerDay: true,
				amenities: true,
				images: true,
				isActive: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!kennel) {
			return null;
		}

		// Cache the result
		await cacheManager.set(CACHE_KEYS.KENNEL_DETAILS(kennelId), kennel, {
			ttl: 300, // 5 minutes
		});

		return kennel;
	}

	async invalidateKennelCache(kennelId?: string): Promise<void> {
		await cacheManager.invalidateKennelCache(kennelId);
	}

	async refreshKennelList(): Promise<CachedKennel[]> {
		// Clear cache and fetch fresh data
		await this.invalidateKennelCache();
		return this.getKennelList();
	}
}

export const kennelCacheService = new KennelCacheService();
