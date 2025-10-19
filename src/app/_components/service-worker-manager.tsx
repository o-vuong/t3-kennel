"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type SwMessageBase = {
	source?: string;
};

type QueueStatusPayload = {
	pending?: number;
	processing?: boolean;
};

type SyncCompletePayload = {
	processed?: number;
	remaining?: number;
};

type SwMessage =
	| (SwMessageBase & ({ type: "QUEUE_STATUS" } & QueueStatusPayload))
	| (SwMessageBase & ({ type: "SYNC_COMPLETE" } & SyncCompletePayload))
	| (SwMessageBase & {
			type: "QUEUE_ITEM_FAILED";
			idempotencyKey?: string;
			status?: number | string;
			error?: string;
	  })
	| (SwMessageBase & { type: "QUEUE_RETRY_SCHEDULED"; idempotencyKey?: string; attempts?: number })
	| (SwMessageBase & { type: "QUEUE_ITEM_PROCESSED"; idempotencyKey?: string })
	| (SwMessageBase & { type: "SW_ACTIVATED"; version?: string });

const INITIAL_QUEUE_STATE = {
	pending: 0,
	processing: false,
};

const TOAST_AUTO_DISMISS_MS = 4000;

export function ServiceWorkerManager() {
	const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
	const [queueState, setQueueState] = useState(INITIAL_QUEUE_STATE);
	const [syncToast, setSyncToast] = useState<string | null>(null);
	const [swVersion, setSwVersion] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		let mounted = true;
		let toastTimeout: number | undefined;
		let refreshing = false;

		const clearToast = () => {
			if (toastTimeout) {
				window.clearTimeout(toastTimeout);
				toastTimeout = undefined;
			}
			setSyncToast(null);
		};

		const scheduleToastClear = () => {
			clearToast();
			toastTimeout = window.setTimeout(() => {
				setSyncToast(null);
				toastTimeout = undefined;
			}, TOAST_AUTO_DISMISS_MS);
		};

		const handleControllerChange = () => {
			if (!refreshing) {
				refreshing = true;
				window.location.reload();
			}
		};

		const handleSwMessage = (event: MessageEvent) => {
			const data = event.data as SwMessage | undefined;
			if (!data || typeof data !== "object" || data.source !== "kennel-sw") {
				return;
			}

			switch (data.type) {
				case "QUEUE_STATUS": {
					const { pending = 0, processing = false } = data;
					setQueueState({
						pending,
						processing,
					});
					if (pending === 0 && !processing) {
						clearToast();
					}
					break;
				}
				case "SYNC_COMPLETE": {
					const processed = data.processed ?? 0;
					const remaining = data.remaining ?? 0;
					if (processed > 0) {
						setSyncToast(`Synced ${processed} change${processed > 1 ? "s" : ""}.`);
						scheduleToastClear();
					} else if (remaining === 0) {
						clearToast();
					}
					setQueueState((current) => ({
						...current,
						pending: remaining,
						processing: false,
					}));
					break;
				}
				case "QUEUE_ITEM_FAILED": {
					const detail = data.error ?? `Status: ${data.status ?? "unknown"}`;
					setSyncToast(`Offline change failed to sync. ${detail}`);
					break;
				}
				case "QUEUE_RETRY_SCHEDULED": {
					setSyncToast("Retrying queued changes when network stabilises.");
					break;
				}
				case "QUEUE_ITEM_PROCESSED": {
					// No-op: the SYNC_COMPLETE message will provide aggregate counts.
					break;
				}
				case "SW_ACTIVATED": {
					setSwVersion(data.version ?? null);
					break;
				}
				default:
					break;
			}
		};

		const handleOnline = () => {
			const controller = navigator.serviceWorker.controller;
			if (controller) {
				controller.postMessage({ type: "ONLINE" });
			}
		};

		const registerServiceWorker = async () => {
			try {
				const registration = await navigator.serviceWorker.register("/sw.js", {
					scope: "/",
				});

				if (!mounted) {
					return;
				}

				if (registration.waiting) {
					setWaitingWorker(registration.waiting);
				}

				registration.addEventListener("updatefound", () => {
					const newWorker = registration.installing;
					if (!newWorker) {
						return;
					}

					newWorker.addEventListener("statechange", () => {
						if (
							mounted &&
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							setWaitingWorker(newWorker);
						}
					});
				});
			} catch (error) {
				console.error("Service worker registration failed", error);
			}
		};

		registerServiceWorker().catch((error) => {
			console.error("Service worker registration threw", error);
		});

		navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
		navigator.serviceWorker.addEventListener("message", handleSwMessage);
		window.addEventListener("online", handleOnline);

		const controller = navigator.serviceWorker.controller;
		if (controller) {
			controller.postMessage({ type: "PROCESS_QUEUE" });
		}

		return () => {
			mounted = false;
			clearToast();

			navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
			navigator.serviceWorker.removeEventListener(
				"message",
				handleSwMessage as EventListener,
			);
			window.removeEventListener("online", handleOnline);

		};
	}, []);

	const handleUpdateNow = () => {
		waitingWorker?.postMessage({ type: "SKIP_WAITING" });
		setWaitingWorker(null);
	};

	const handleUpdateLater = () => {
		setWaitingWorker(null);
	};

	const queueBannerVisible = queueState.pending > 0 || queueState.processing || syncToast;

	const queueText = useMemo(() => {
		if (queueState.processing) {
			return "Replaying offline changes…";
		}

		if (queueState.pending > 0) {
			return `${queueState.pending} offline change${queueState.pending > 1 ? "s" : ""} queued`;
		}

		return syncToast;
	}, [queueState.pending, queueState.processing, syncToast]);

	const showUpdateBanner = Boolean(waitingWorker);

	if (!showUpdateBanner && !queueBannerVisible) {
		return null;
	}

	return (
		<div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] mx-auto flex max-w-xl flex-col gap-3 px-4 pb-4">
			{showUpdateBanner ? (
				<div className="pointer-events-auto rounded-lg border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
								New update ready
							</p>
							<p className="text-xs text-slate-600 dark:text-slate-300">
								{swVersion ? `Version ${swVersion} is available.` : "Refresh to load the latest improvements."}
							</p>
						</div>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={handleUpdateLater}>
								Later
							</Button>
							<Button size="sm" onClick={handleUpdateNow}>
								Update now
							</Button>
						</div>
					</div>
				</div>
			) : null}

			{queueBannerVisible && queueText ? (
				<div
					className={cn(
						"pointer-events-auto rounded-lg border border-blue-200 bg-blue-600/95 px-4 py-3 text-sm text-white shadow-lg backdrop-blur",
						queueState.processing ? "animate-pulse" : "",
					)}
				>
					{queueText}
				</div>
			) : null}
		</div>
	);
}
