/* eslint-disable no-restricted-globals */
/**
 * Kennel Management System — Production Service Worker
 *
 * Responsibilities:
 * - Offline-first caching for application shell and static assets
 * - Background Sync powered write queue with idempotency keys
 * - Push notification handling
 * - Versioned updates with client notifications
 *
 * This service worker intentionally avoids external dependencies so it can be
 * hosted as a static asset within Next.js. All mutable operations are routed
 * through IndexedDB to guarantee durability even when the browser is closed.
 */

const SW_VERSION = "2025.02.10";
const STATIC_CACHE = `kennel-static-${SW_VERSION}`;
const PAGE_CACHE = `kennel-pages-${SW_VERSION}`;
const API_CACHE = `kennel-api-${SW_VERSION}`;
const OFFLINE_PAGE = "/offline.html";

const DB_NAME = "kennel-offline";
const DB_VERSION = 1;
const QUEUE_STORE = "offline-queue";

const MAX_QUEUE_ATTEMPTS = 5;
const RETRYABLE_STATUS = [408, 425, 429, 500, 502, 503, 504];
const PRECACHE_URLS = [
	"/",
	"/login",
	"/owner/control",
	"/admin/dashboard",
	"/staff/overview",
	"/customer/home",
	"/manifest.json",
	OFFLINE_PAGE,
	"/icons/icon-192x192.png",
	"/icons/icon-512x512.png",
];

const SUPPORTS_IDB = "indexedDB" in self;
let isProcessingQueue = false;

// Utility helpers -----------------------------------------------------------

const delay = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});

const DEBUG = self.location.hostname === "localhost";

const log = (...args) => {
	if (DEBUG) {
		console.log("[SW]", ...args);
	}
};

async function notifyClients(message) {
	const clients = await self.clients.matchAll({
		type: "window",
		includeUncontrolled: true,
	});

	for (const client of clients) {
		client.postMessage({
			source: "kennel-sw",
			...message,
		});
	}
}

function isNavigationRequest(request) {
	return (
		request.mode === "navigate" ||
		(request.method === "GET" &&
			request.headers.get("accept")?.includes("text/html"))
	);
}

function isApiRequest(url) {
	return url.pathname.startsWith("/api/");
}

function shouldCacheResponse(response) {
	return (
		response &&
		response.status === 200 &&
		["basic", "cors"].includes(response.type)
	);
}

// IndexedDB helpers --------------------------------------------------------

function openDatabase() {
	if (!SUPPORTS_IDB) {
		return Promise.reject(new Error("IndexedDB is not supported"));
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onupgradeneeded = () => {
			const db = request.result;

			if (!db.objectStoreNames.contains(QUEUE_STORE)) {
				const store = db.createObjectStore(QUEUE_STORE, {
					keyPath: "idempotencyKey",
				});
				store.createIndex("timestamp", "timestamp");
			}
		};

		request.onsuccess = () => {
			resolve(request.result);
		};

		request.onerror = () => {
			reject(request.error);
		};
	});
}

async function withQueueStore(mode, callback) {
	const db = await openDatabase();

	try {
		return await new Promise((resolve, reject) => {
			const tx = db.transaction(QUEUE_STORE, mode);
			const store = tx.objectStore(QUEUE_STORE);
			const result = callback(store);

			tx.oncomplete = () => {
				resolve(result?.result ?? result);
			};
			tx.onerror = () => {
				reject(tx.error);
			};
		});
	} finally {
		db.close();
	}
}

async function enqueueRequest(entry) {
	await withQueueStore("readwrite", (store) => {
		store.put(entry);
	});

	await notifyClients({
		type: "QUEUE_STATUS",
		pending: await getQueueSize(),
		processing: false,
	});
}

async function dequeueRequest(idempotencyKey) {
	await withQueueStore("readwrite", (store) => {
		store.delete(idempotencyKey);
	});
}

async function updateRequest(entry) {
	await withQueueStore("readwrite", (store) => {
		store.put(entry);
	});
}

async function getQueuedRequests() {
	const entries = await withQueueStore("readonly", (store) => {
		return store.getAll();
	});

	return Array.isArray(entries) ? entries : [];
}

async function getQueueSize() {
	const entries = await getQueuedRequests();
	return entries.length;
}

// Cache strategies ---------------------------------------------------------

async function preCacheStaticAssets() {
	const cache = await caches.open(STATIC_CACHE);

	await cache.addAll(
		PRECACHE_URLS.map((path) => new Request(path, { credentials: "include" })),
	);
}

async function cleanupOldCaches() {
	const expectedCaches = new Set([STATIC_CACHE, PAGE_CACHE, API_CACHE]);
	const cacheNames = await caches.keys();

	await Promise.all(
		cacheNames
			.filter((cacheName) => !expectedCaches.has(cacheName))
			.map((cacheName) => caches.delete(cacheName)),
	);
}

async function cacheFirst(request) {
	const cache = await caches.open(STATIC_CACHE);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		if (shouldCacheResponse(response)) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		log("cacheFirst failed", error);
		throw error;
	}
}

async function networkFirstPage(request) {
	const cache = await caches.open(PAGE_CACHE);

	try {
		const response = await fetch(request);

		if (shouldCacheResponse(response)) {
			cache.put(request, response.clone());
		}

		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}

		const fallbackCache = await caches.open(STATIC_CACHE);
		const offline = await fallbackCache.match(OFFLINE_PAGE);

		if (offline) {
			return offline;
		}

		return new Response("Offline", { status: 503, statusText: "Offline" });
	}
}

async function networkFirstApi(request) {
	const cache = await caches.open(API_CACHE);

	try {
		const response = await fetch(request);

		if (shouldCacheResponse(response)) {
			cache.put(request, response.clone());
		}

		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) {
			return cached;
		}

		return new Response(
			JSON.stringify({
				error: "offline",
				message: "Network unavailable. Request served from cache.",
			}),
			{
				status: 503,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

async function handleMutatingRequest(request) {
	const cloned = request.clone();

	try {
		const response = await fetch(request);

		if (
			response.status >= 200 &&
			response.status < 400 &&
			!RETRYABLE_STATUS.includes(response.status)
		) {
			return response;
		}

		if (!RETRYABLE_STATUS.includes(response.status)) {
			return response;
		}

		throw new Error(`Retryable status ${response.status}`);
	} catch (error) {
		if (!SUPPORTS_IDB) {
			return new Response(
				JSON.stringify({
					error: "offline_queue_not_supported",
					message: "IndexedDB unavailable. Cannot queue request offline.",
				}),
				{
					status: 503,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const headers = {};
		cloned.headers.forEach((value, key) => {
			headers[key] = value;
		});

		const contentType =
			headers["content-type"] ?? headers["Content-Type"] ?? "";

		if (
			contentType &&
			!contentType.includes("application/json") &&
			!contentType.includes("application/x-www-form-urlencoded")
		) {
			return new Response(
				JSON.stringify({
					error: "unsupported_content_type",
					message:
						"Offline queue currently supports JSON or form submissions only.",
				}),
				{
					status: 415,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const body = await cloned.text();
		const idempotencyKey =
			headers["x-idempotency-key"] ??
			headers["X-Idempotency-Key"] ??
			`offline-${typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

		headers["x-idempotency-key"] = idempotencyKey;

		const entry = {
			idempotencyKey,
			url: cloned.url,
			method: cloned.method,
			headers,
			body,
			timestamp: Date.now(),
			attempts: 0,
		};

		await enqueueRequest(entry);
		await scheduleBackgroundSync();

		return new Response(
			JSON.stringify({
				queued: true,
				idempotencyKey,
				message: "Request queued and will be synced when back online.",
			}),
			{
				status: 202,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}

// Background sync queue ----------------------------------------------------

async function scheduleBackgroundSync() {
	if (!("sync" in self.registration)) {
		await processQueue();
		return;
	}

	try {
		await self.registration.sync.register("kennel-offline-sync");
	} catch (error) {
		log("Background sync registration failed", error);
		await processQueue();
	}
}

async function processQueue() {
	if (isProcessingQueue) {
		return;
	}

	isProcessingQueue = true;
	await notifyClients({
		type: "QUEUE_STATUS",
		pending: await getQueueSize(),
		processing: true,
	});

	try {
		const entries = await getQueuedRequests();

		if (!entries.length) {
			await notifyClients({
				type: "QUEUE_STATUS",
				pending: 0,
				processing: false,
			});
			return;
		}

		entries.sort((a, b) => a.timestamp - b.timestamp);

		let processed = 0;

		for (const entry of entries) {
			try {
				const response = await fetch(entry.url, {
					method: entry.method,
					headers: entry.headers,
					body:
						entry.method === "GET" || entry.method === "HEAD"
							? undefined
							: entry.body,
					credentials: "include",
				});

				if (
					response.status >= 400 &&
					!RETRYABLE_STATUS.includes(response.status)
				) {
					await dequeueRequest(entry.idempotencyKey);
					await notifyClients({
						type: "QUEUE_ITEM_FAILED",
						idempotencyKey: entry.idempotencyKey,
						status: response.status,
					});
					continue;
				}

				if (RETRYABLE_STATUS.includes(response.status)) {
					throw new Error(`Retryable status ${response.status}`);
				}

				await dequeueRequest(entry.idempotencyKey);
				processed += 1;
				await notifyClients({
					type: "QUEUE_ITEM_PROCESSED",
					idempotencyKey: entry.idempotencyKey,
				});
			} catch (error) {
				const attempts = (entry.attempts ?? 0) + 1;

				if (attempts >= MAX_QUEUE_ATTEMPTS) {
					await dequeueRequest(entry.idempotencyKey);
					await notifyClients({
						type: "QUEUE_ITEM_FAILED",
						idempotencyKey: entry.idempotencyKey,
						error: error instanceof Error ? error.message : "Unknown error",
						status: "max_attempts_exceeded",
					});
					continue;
				}

				entry.attempts = attempts;
				entry.retryAt = Date.now();
				await updateRequest(entry);

				await notifyClients({
					type: "QUEUE_RETRY_SCHEDULED",
					idempotencyKey: entry.idempotencyKey,
					attempts,
				});

				// Abort further processing to respect retry backoff
				break;
			}

			await delay(250);
		}

		await notifyClients({
			type: "SYNC_COMPLETE",
			processed,
			remaining: await getQueueSize(),
		});
	} finally {
		isProcessingQueue = false;
		await notifyClients({
			type: "QUEUE_STATUS",
			pending: await getQueueSize(),
			processing: false,
		});
	}
}

// Event listeners ----------------------------------------------------------

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			await preCacheStaticAssets();
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			await cleanupOldCaches();

			if (SUPPORTS_IDB) {
				await processQueue();
			}

			await self.clients.claim();
			await notifyClients({ type: "SW_ACTIVATED", version: SW_VERSION });
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	if (request.cache === "only-if-cached" && request.mode === "no-cors") {
		return;
	}

	if (url.origin !== self.location.origin) {
		return;
	}

	if (request.method !== "GET") {
		event.respondWith(handleMutatingRequest(request));
		return;
	}

	if (isNavigationRequest(request)) {
		event.respondWith(networkFirstPage(request));
		return;
	}

	if (isApiRequest(url)) {
		event.respondWith(networkFirstApi(request));
		return;
	}

	event.respondWith(cacheFirst(request));
});

self.addEventListener("sync", (event) => {
	if (event.tag === "kennel-offline-sync") {
		event.waitUntil(processQueue());
	}
});

self.addEventListener("message", (event) => {
	const data = event.data;

	if (!data || typeof data !== "object") {
		return;
	}

	if (data.type === "SKIP_WAITING") {
		self.skipWaiting();
		return;
	}

	if (data.type === "PROCESS_QUEUE") {
		event.waitUntil(processQueue());
		return;
	}

	if (data.type === "ONLINE") {
		event.waitUntil(processQueue());
	}
});

self.addEventListener("push", (event) => {
	if (!event.data) {
		return;
	}

	const data = (() => {
		try {
			return event.data.json();
		} catch {
			return { title: "Kennel Manager", body: event.data.text() };
		}
	})();

	const title = data.title ?? "Kennel Manager";
	const options = {
		body: data.body,
		icon: "/icons/icon-192x192.png",
		badge: "/icons/icon-96x96.png",
		tag: data.tag ?? "kennel-notification",
		data: data.data ?? {},
		actions: data.actions ?? [],
		renotify: data.renotify ?? false,
		requireInteraction: data.requireInteraction ?? false,
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	const targetUrl = event.notification.data?.url ?? "/";

	event.waitUntil(
		(async () => {
			const allClients = await self.clients.matchAll({ type: "window" });

			for (const client of allClients) {
				if (client.url === targetUrl && "focus" in client) {
					return client.focus();
				}
			}

			if (self.clients.openWindow) {
				return self.clients.openWindow(targetUrl);
			}

			return undefined;
		})(),
	);
});
