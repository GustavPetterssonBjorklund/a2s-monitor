import { prisma } from '$lib/server/db';
import { getA2SPollState } from '$lib/server/polling';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const poll = getA2SPollState();
	const projects = await prisma.project.findMany({
		include: {
			services: {
				orderBy: { createdAt: 'asc' }
			}
		},
		orderBy: { createdAt: 'asc' }
	});

	return {
		projects,
		poll,
		loadedAt: Date.now()
	};
};
