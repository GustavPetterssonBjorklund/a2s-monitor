import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export const ADMIN_COOKIE = 'a2s_admin';

export function adminToken() {
	const password = env.ADMIN_PASSWORD;

	if (!password) {
		return null;
	}

	return createHash('sha256').update(`a2s-admin:${password}`).digest('hex');
}

function constantTimeEquals(left: string, right: string) {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAdmin(event: RequestEvent) {
	const token = adminToken();
	const cookie = event.cookies.get(ADMIN_COOKIE);

	return Boolean(token && cookie && constantTimeEquals(cookie, token));
}
