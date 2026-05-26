import { refreshEnabledServices } from '$lib/server/a2s';

const POLL_INTERVAL_MS = 5_000;

const globalForPolling = globalThis as unknown as {
	a2sPoller?: NodeJS.Timeout;
	a2sPollerRunning?: boolean;
	a2sNextPollAt?: number;
};

async function poll() {
	if (globalForPolling.a2sPollerRunning) {
		return;
	}

	globalForPolling.a2sPollerRunning = true;

	try {
		await refreshEnabledServices();
	} catch (error) {
		console.error('A2S polling failed', error);
	} finally {
		globalForPolling.a2sPollerRunning = false;
	}
}

export function startA2SPolling() {
	if (globalForPolling.a2sPoller) {
		return;
	}

	globalForPolling.a2sNextPollAt = Date.now() + POLL_INTERVAL_MS;

	globalForPolling.a2sPoller = setInterval(() => {
		globalForPolling.a2sNextPollAt = Date.now() + POLL_INTERVAL_MS;
		void poll();
	}, POLL_INTERVAL_MS);

	void poll();
}

export function getA2SPollState() {
	return {
		intervalMs: POLL_INTERVAL_MS,
		nextPollAt: globalForPolling.a2sNextPollAt ?? null
	};
}
