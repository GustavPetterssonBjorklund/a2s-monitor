import { prisma } from '$lib/server/db';

type ProjectWithServices = Awaited<ReturnType<typeof getProjectForExport>>;

type ImportedProject = {
	name: string;
	description: string | null;
	services: {
		name: string;
		host: string;
		port: number;
		queryPort: number | null;
		enabled: boolean;
	}[];
};

export function projectExportFilename(name: string) {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');

	return `${slug || 'project'}.json`;
}

export async function getProjectForExport(projectId: number) {
	return prisma.project.findUnique({
		where: { id: projectId },
		include: {
			services: {
				orderBy: { createdAt: 'asc' }
			}
		}
	});
}

export function serializeProject(project: NonNullable<ProjectWithServices>) {
	return {
		format: 'a2s-monitor-project',
		version: 1,
		exportedAt: new Date().toISOString(),
		project: {
			name: project.name,
			description: project.description,
			services: project.services.map((service) => ({
				name: service.name,
				host: service.host,
				port: service.port,
				queryPort: service.queryPort,
				enabled: service.enabled
			}))
		}
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizedString(value: unknown) {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();

	return trimmed === '' ? null : trimmed;
}

function optionalDescription(value: unknown) {
	if (typeof value !== 'string') {
		return null;
	}

	const trimmed = value.trim();

	return trimmed === '' ? null : trimmed;
}

function normalizedPort(value: unknown) {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 65535) {
		return null;
	}

	return value;
}

export function parseProjectImport(value: unknown): ImportedProject {
	if (!isRecord(value) || value.format !== 'a2s-monitor-project' || value.version !== 1) {
		throw new Error('Unsupported project JSON format.');
	}

	const project = value.project;

	if (!isRecord(project)) {
		throw new Error('Project JSON is missing project data.');
	}

	const name = normalizedString(project.name);

	if (!name) {
		throw new Error('Project JSON must include a project name.');
	}

	if (!Array.isArray(project.services)) {
		throw new Error('Project JSON must include a services list.');
	}

	const services = project.services.map((service, index) => {
		if (!isRecord(service)) {
			throw new Error(`Service ${index + 1} is invalid.`);
		}

		const serviceName = normalizedString(service.name);
		const host = normalizedString(service.host);
		const port = normalizedPort(service.port);
		const queryPort = service.queryPort === null ? null : normalizedPort(service.queryPort);

		if (!serviceName || !host || !port) {
			throw new Error(`Service ${index + 1} must include name, host, and a valid port.`);
		}

		if (service.queryPort !== null && queryPort === null) {
			throw new Error(`Service ${index + 1} has an invalid query port.`);
		}

		return {
			name: serviceName,
			host,
			port,
			queryPort,
			enabled: service.enabled === false ? false : true
		};
	});

	return {
		name,
		description: optionalDescription(project.description),
		services
	};
}

export async function rebuildProjectFromJson(value: unknown) {
	const project = parseProjectImport(value);

	return prisma.project.create({
		data: {
			name: project.name,
			description: project.description,
			services: {
				create: project.services
			}
		}
	});
}
