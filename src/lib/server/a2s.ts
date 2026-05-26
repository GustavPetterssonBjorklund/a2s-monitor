import { GameDig } from 'gamedig';
import { prisma } from '$lib/server/db';

const QUERY_TIMEOUT_MS = 2000;

type ServiceTarget = {
	id: number;
	host: string;
	port: number;
	queryPort: number | null;
};

function toErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'A2S query failed';
}

export async function refreshService(service: ServiceTarget) {
	try {
		const gameDig = new GameDig();
		const info = await gameDig.query({
			type: 'ase',
			host: service.host,
			port: service.queryPort ?? service.port,
			givenPortOnly: true,
			socketTimeout: QUERY_TIMEOUT_MS,
			attemptTimeout: QUERY_TIMEOUT_MS * 2,
			requestPlayers: false,
			requestRules: false
		});

		return await prisma.service.update({
			where: { id: service.id },
			data: {
				online: true,
				lastCheckedAt: new Date(),
				lastError: null,
				serverName: info.name || null,
				map: info.map || null,
				game: info.raw?.game || info.game || null,
				players: info.numplayers ?? null,
				maxPlayers: info.maxplayers ?? null
			}
		});
	} catch (error) {
		return await prisma.service.update({
			where: { id: service.id },
			data: {
				online: false,
				lastCheckedAt: new Date(),
				lastError: toErrorMessage(error)
			}
		});
	}
}

export async function refreshServiceById(serviceId: number) {
	const service = await prisma.service.findUnique({
		where: { id: serviceId },
		select: { id: true, host: true, port: true, queryPort: true }
	});

	if (!service) {
		return null;
	}

	return refreshService(service);
}

export async function refreshEnabledServices() {
	const services = await prisma.service.findMany({
		where: { enabled: true },
		select: { id: true, host: true, port: true, queryPort: true },
		orderBy: { createdAt: 'asc' }
	});

	for (const service of services) {
		await refreshService(service);
	}
}
