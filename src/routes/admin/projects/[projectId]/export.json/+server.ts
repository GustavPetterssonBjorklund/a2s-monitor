import { error, json } from '@sveltejs/kit';
import { isAdmin } from '$lib/server/admin-auth';
import {
	getProjectForExport,
	projectExportFilename,
	serializeProject
} from '$lib/server/project-json';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	if (!isAdmin(event)) {
		error(401, 'Admin login required.');
	}

	const projectId = Number.parseInt(event.params.projectId, 10);

	if (!Number.isInteger(projectId) || projectId < 1) {
		error(400, 'Project is invalid.');
	}

	const project = await getProjectForExport(projectId);

	if (!project) {
		error(404, 'Project not found.');
	}

	return json(serializeProject(project), {
		headers: {
			'content-disposition': `attachment; filename="${projectExportFilename(project.name)}"`
		}
	});
};
