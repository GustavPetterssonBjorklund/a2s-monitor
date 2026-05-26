import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/db';
import { refreshEnabledServices, refreshServiceById } from '$lib/server/a2s';
import { getA2SPollState } from '$lib/server/polling';
import type { Actions, PageServerLoad } from './$types';

function requiredString(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	return value.trim();
}

function optionalString(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	return value.trim();
}

function positiveInt(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
		return null;
	}

	return parsed;
}

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

export const actions: Actions = {
	createProject: async ({ request }) => {
		const formData = await request.formData();
		const name = requiredString(formData, 'name');
		const description = optionalString(formData, 'description');

		if (!name) {
			return fail(400, { message: 'Project name is required.' });
		}

		await prisma.project.create({
			data: { name, description }
		});

		return { message: 'Project created.' };
	},
	createService: async ({ request }) => {
		const formData = await request.formData();
		const projectId = positiveInt(formData, 'projectId');
		const name = requiredString(formData, 'name');
		const host = requiredString(formData, 'host');
		const port = positiveInt(formData, 'port') ?? 27015;
		const queryPort = positiveInt(formData, 'queryPort');

		if (!projectId || !name || !host) {
			return fail(400, { message: 'Project, service name, and host are required.' });
		}

		const project = await prisma.project.findUnique({
			where: { id: projectId },
			select: { id: true }
		});

		if (!project) {
			return fail(404, { message: 'Project not found.' });
		}

		await prisma.service.create({
			data: { projectId, name, host, port, queryPort }
		});

		return { message: 'Service created.' };
	},
	refreshService: async ({ request }) => {
		const formData = await request.formData();
		const serviceId = positiveInt(formData, 'serviceId');

		if (!serviceId) {
			return fail(400, { message: 'Service is required.' });
		}

		const service = await refreshServiceById(serviceId);

		if (!service) {
			return fail(404, { message: 'Service not found.' });
		}

		return { message: 'Service refreshed.' };
	},
	deleteService: async ({ request }) => {
		const formData = await request.formData();
		const serviceId = positiveInt(formData, 'serviceId');

		if (!serviceId) {
			return fail(400, { message: 'Service is required.' });
		}

		const service = await prisma.service.findUnique({
			where: { id: serviceId },
			select: { id: true }
		});

		if (!service) {
			return fail(404, { message: 'Service not found.' });
		}

		await prisma.service.delete({
			where: { id: serviceId }
		});

		return { message: 'Service removed.' };
	},
	refreshAll: async () => {
		await refreshEnabledServices();

		return { message: 'Enabled services refreshed.' };
	}
};
