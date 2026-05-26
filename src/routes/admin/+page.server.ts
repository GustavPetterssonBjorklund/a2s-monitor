import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { ADMIN_COOKIE, adminToken, isAdmin } from '$lib/server/admin-auth';
import { refreshEnabledServices, refreshServiceById } from '$lib/server/a2s';
import { prisma } from '$lib/server/db';
import { rebuildProjectFromJson } from '$lib/server/project-json';
import type { Actions, PageServerLoad, RequestEvent } from './$types';

function requireAdmin(event: RequestEvent) {
	if (!isAdmin(event)) {
		return fail(401, { message: 'Admin login required.' });
	}

	return null;
}

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

function positiveId(formData: FormData, key: string) {
	const value = formData.get(key);

	if (typeof value !== 'string' || value.trim() === '') {
		return null;
	}

	const parsed = Number.parseInt(value, 10);

	if (!Number.isInteger(parsed) || parsed < 1) {
		return null;
	}

	return parsed;
}

function portNumber(formData: FormData, key: string) {
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

export const load: PageServerLoad = async (event) => {
	const authenticated = isAdmin(event);
	const projects = authenticated
		? await prisma.project.findMany({
				include: {
					services: {
						orderBy: { createdAt: 'asc' }
					}
				},
				orderBy: { createdAt: 'asc' }
			})
		: [];

	return {
		authenticated,
		passwordConfigured: Boolean(env.ADMIN_PASSWORD),
		projects
	};
};

export const actions: Actions = {
	login: async (event) => {
		const token = adminToken();
		const formData = await event.request.formData();
		const password = requiredString(formData, 'password');

		if (!token) {
			return fail(500, { message: 'ADMIN_PASSWORD is not configured.' });
		}

		if (!password || password !== env.ADMIN_PASSWORD) {
			return fail(401, { message: 'Invalid password.' });
		}

		event.cookies.set(ADMIN_COOKIE, token, {
			httpOnly: true,
			maxAge: 60 * 60 * 12,
			path: '/',
			sameSite: 'strict',
			secure: event.url.protocol === 'https:'
		});

		return { message: 'Logged in.' };
	},
	logout: async (event) => {
		event.cookies.delete(ADMIN_COOKIE, { path: '/' });

		redirect(303, '/');
	},
	createProject: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
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
	updateProject: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const projectId = positiveId(formData, 'projectId');
		const name = requiredString(formData, 'name');
		const description = optionalString(formData, 'description');

		if (!projectId || !name) {
			return fail(400, { message: 'Project and name are required.' });
		}

		await prisma.project.update({
			where: { id: projectId },
			data: { name, description }
		});

		return { message: 'Project updated.' };
	},
	deleteProject: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const projectId = positiveId(formData, 'projectId');

		if (!projectId) {
			return fail(400, { message: 'Project is required.' });
		}

		await prisma.project.delete({
			where: { id: projectId }
		});

		return { message: 'Project removed.' };
	},
	importProject: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const upload = formData.get('projectJson');

		if (!(upload instanceof File) || upload.size === 0) {
			return fail(400, { message: 'Choose a project JSON file to import.' });
		}

		try {
			const contents = await upload.text();
			const parsed = JSON.parse(contents) as unknown;
			const project = await rebuildProjectFromJson(parsed);

			return { message: `Project "${project.name}" imported.` };
		} catch (error) {
			const message =
				error instanceof Error ? error.message : 'Project JSON could not be imported.';

			return fail(400, { message });
		}
	},
	createService: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const projectId = positiveId(formData, 'projectId');
		const name = requiredString(formData, 'name');
		const host = requiredString(formData, 'host');
		const port = portNumber(formData, 'port') ?? 27015;
		const queryPort = portNumber(formData, 'queryPort');

		if (!projectId || !name || !host) {
			return fail(400, { message: 'Project, service name, and host are required.' });
		}

		await prisma.service.create({
			data: { projectId, name, host, port, queryPort }
		});

		return { message: 'Service created.' };
	},
	updateService: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const serviceId = positiveId(formData, 'serviceId');
		const name = requiredString(formData, 'name');
		const host = requiredString(formData, 'host');
		const port = portNumber(formData, 'port');
		const queryPort = portNumber(formData, 'queryPort');
		const enabled = formData.get('enabled') === 'on';

		if (!serviceId || !name || !host || !port) {
			return fail(400, { message: 'Service, name, host, and port are required.' });
		}

		await prisma.service.update({
			where: { id: serviceId },
			data: { name, host, port, queryPort, enabled }
		});

		return { message: 'Service updated.' };
	},
	refreshService: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const serviceId = positiveId(formData, 'serviceId');

		if (!serviceId) {
			return fail(400, { message: 'Service is required.' });
		}

		const service = await refreshServiceById(serviceId);

		if (!service) {
			return fail(404, { message: 'Service not found.' });
		}

		return { message: 'Service refreshed.' };
	},
	deleteService: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		const formData = await event.request.formData();
		const serviceId = positiveId(formData, 'serviceId');

		if (!serviceId) {
			return fail(400, { message: 'Service is required.' });
		}

		await prisma.service.delete({
			where: { id: serviceId }
		});

		return { message: 'Service removed.' };
	},
	refreshAll: async (event) => {
		const authFailure = requireAdmin(event);
		if (authFailure) return authFailure;

		await refreshEnabledServices();

		return { message: 'Enabled services refreshed.' };
	}
};
