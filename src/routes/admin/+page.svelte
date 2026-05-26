<script lang="ts">
	import { resolve } from '$app/paths';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Admin - A2S Monitor</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 text-zinc-950">
	{#if !data.passwordConfigured}
		<div class="flex min-h-screen items-center justify-center px-5">
			<p class="text-sm text-red-700">Set ADMIN_PASSWORD in your .env file.</p>
		</div>
	{:else if !data.authenticated}
		<div class="flex min-h-screen items-center justify-center px-5">
			<form class="grid w-full max-w-xs gap-3" method="POST" action="?/login">
				<h1 class="text-center text-xl font-semibold text-zinc-950">Admin</h1>
				<input
					class="h-11 rounded-md border-zinc-300 bg-white text-center text-sm shadow-sm"
					name="password"
					placeholder="Password"
					required
					type="password"
				/>
				<button
					class="inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
					type="submit"
				>
					Log in
				</button>
				{#if form?.message}
					<p class="text-center text-sm text-red-700">{form.message}</p>
				{/if}
			</form>
		</div>
	{:else}
		<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8">
			<header
				class="flex flex-col gap-4 border-b border-zinc-300 pb-5 lg:flex-row lg:items-end lg:justify-between"
			>
				<div>
					<p class="text-sm font-medium tracking-wide text-emerald-700 uppercase">A2S Monitor</p>
					<h1 class="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">Admin</h1>
				</div>

				<div class="flex flex-wrap gap-3">
					<a
						class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 hover:bg-white"
						href={resolve('/')}
					>
						View display
					</a>
					<form method="POST" action="?/logout">
						<button
							class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 hover:bg-white"
							type="submit"
						>
							Log out
						</button>
					</form>
				</div>
			</header>

			{#if form?.message}
				<p class="border-l-4 border-emerald-600 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm">
					{form.message}
				</p>
			{/if}
			<section
				class="grid gap-4 border-b border-zinc-300 pb-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]"
			>
				<div>
					<h2 class="text-lg font-semibold text-zinc-950">Create project</h2>
					<p class="mt-2 max-w-2xl text-sm text-zinc-600">
						Projects group services on the public display page. You can also rebuild a project from
						an exported JSON file.
					</p>
				</div>

				<div class="grid gap-4">
					<form class="grid gap-3 bg-white p-4 shadow-sm" method="POST" action="?/createProject">
						<label class="grid gap-1 text-sm font-medium text-zinc-800">
							Name
							<input
								class="h-10 rounded-md border-zinc-300 bg-white text-sm"
								name="name"
								required
							/>
						</label>

						<label class="grid gap-1 text-sm font-medium text-zinc-800">
							Description
							<textarea
								class="min-h-20 rounded-md border-zinc-300 bg-white text-sm"
								name="description"
							></textarea>
						</label>

						<button
							class="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
							type="submit"
						>
							Create project
						</button>
					</form>

					<form
						class="grid gap-3 bg-white p-4 shadow-sm"
						enctype="multipart/form-data"
						method="POST"
						action="?/importProject"
					>
						<label class="grid gap-1 text-sm font-medium text-zinc-800">
							Import project JSON
							<input
								accept="application/json,.json"
								class="rounded-md border border-zinc-300 bg-white text-sm file:mr-3 file:h-10 file:border-0 file:bg-zinc-100 file:px-4 file:text-sm file:font-medium file:text-zinc-900"
								name="projectJson"
								required
								type="file"
							/>
						</label>
						<button
							class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
							type="submit"
						>
							Rebuild from JSON
						</button>
					</form>
				</div>
			</section>

			<div class="flex justify-end">
				<form method="POST" action="?/refreshAll">
					<button
						class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
						type="submit"
					>
						Refresh all
					</button>
				</form>
			</div>

			{#if data.projects.length === 0}
				<section
					class="border border-dashed border-zinc-300 bg-white px-5 py-10 text-center text-sm text-zinc-600"
				>
					No projects yet.
				</section>
			{:else}
				<section class="grid gap-8">
					{#each data.projects as project (project.id)}
						<article class="grid gap-4 border-b border-zinc-300 pb-8">
							<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
								<form
									class="grid gap-3 bg-white p-4 shadow-sm"
									method="POST"
									action="?/updateProject"
								>
									<input name="projectId" type="hidden" value={project.id} />
									<label class="grid gap-1 text-sm font-medium text-zinc-800">
										Project name
										<input
											class="h-10 rounded-md border-zinc-300 bg-white text-sm"
											name="name"
											required
											value={project.name}
										/>
									</label>
									<label class="grid gap-1 text-sm font-medium text-zinc-800">
										Description
										<textarea
											class="min-h-20 rounded-md border-zinc-300 bg-white text-sm"
											name="description">{project.description ?? ''}</textarea
										>
									</label>
									<button
										class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
										type="submit"
									>
										Save project
									</button>
								</form>

								<div class="grid content-start gap-3 bg-white p-4 shadow-sm">
									<a
										class="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
										href={resolve(`/admin/projects/${project.id}/export.json`)}
									>
										Download JSON
									</a>

									<form class="grid gap-3" method="POST" action="?/createService">
										<input name="projectId" type="hidden" value={project.id} />
										<h3 class="text-sm font-semibold text-zinc-950">Add service</h3>
										<div class="grid gap-3 sm:grid-cols-2">
											<label class="grid gap-1 text-sm font-medium text-zinc-800">
												Name
												<input
													class="h-10 rounded-md border-zinc-300 bg-white text-sm"
													name="name"
													required
												/>
											</label>
											<label class="grid gap-1 text-sm font-medium text-zinc-800">
												Port
												<input
													class="h-10 rounded-md border-zinc-300 bg-white text-sm"
													inputmode="numeric"
													max="65535"
													min="1"
													name="port"
													placeholder="27015"
													type="number"
												/>
											</label>
										</div>
										<label class="grid gap-1 text-sm font-medium text-zinc-800">
											Host
											<input
												class="h-10 rounded-md border-zinc-300 bg-white text-sm"
												name="host"
												required
											/>
										</label>
										<label class="grid gap-1 text-sm font-medium text-zinc-800">
											Query port
											<input
												class="h-10 rounded-md border-zinc-300 bg-white text-sm"
												inputmode="numeric"
												max="65535"
												min="1"
												name="queryPort"
												type="number"
											/>
										</label>
										<button
											class="inline-flex h-10 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800"
											type="submit"
										>
											Add service
										</button>
									</form>

									<form method="POST" action="?/deleteProject">
										<input name="projectId" type="hidden" value={project.id} />
										<button
											class="inline-flex h-10 w-full items-center justify-center rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50"
											onclick={(event) => {
												if (!confirm('Remove this project and all services?')) {
													event.preventDefault();
												}
											}}
											type="submit"
										>
											Delete project
										</button>
									</form>
								</div>
							</div>

							{#if project.services.length === 0}
								<p class="bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">No services.</p>
							{:else}
								<div class="grid gap-3">
									{#each project.services as service (service.id)}
										<div class="grid gap-3 bg-white p-4 shadow-sm">
											<form
												class="grid gap-3 lg:grid-cols-[1fr_1fr_110px_110px_auto] lg:items-end"
												method="POST"
												action="?/updateService"
											>
												<input name="serviceId" type="hidden" value={service.id} />
												<label class="grid gap-1 text-sm font-medium text-zinc-800">
													Service
													<input
														class="h-10 rounded-md border-zinc-300 bg-white text-sm"
														name="name"
														required
														value={service.name}
													/>
												</label>
												<label class="grid gap-1 text-sm font-medium text-zinc-800">
													Host
													<input
														class="h-10 rounded-md border-zinc-300 bg-white text-sm"
														name="host"
														required
														value={service.host}
													/>
												</label>
												<label class="grid gap-1 text-sm font-medium text-zinc-800">
													Port
													<input
														class="h-10 rounded-md border-zinc-300 bg-white text-sm"
														inputmode="numeric"
														max="65535"
														min="1"
														name="port"
														required
														type="number"
														value={service.port}
													/>
												</label>
												<label class="grid gap-1 text-sm font-medium text-zinc-800">
													Query
													<input
														class="h-10 rounded-md border-zinc-300 bg-white text-sm"
														inputmode="numeric"
														max="65535"
														min="1"
														name="queryPort"
														type="number"
														value={service.queryPort ?? ''}
													/>
												</label>
												<div class="flex flex-wrap items-center gap-3">
													<label
														class="inline-flex items-center gap-2 text-sm font-medium text-zinc-800"
													>
														<input
															class="rounded border-zinc-300"
															checked={service.enabled}
															name="enabled"
															type="checkbox"
														/>
														Enabled
													</label>
													<button
														class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
														type="submit"
													>
														Save
													</button>
												</div>
											</form>

											<div class="flex flex-wrap gap-2">
												<form method="POST" action="?/refreshService">
													<input name="serviceId" type="hidden" value={service.id} />
													<button
														class="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
														type="submit"
													>
														Refresh
													</button>
												</form>
												<form method="POST" action="?/deleteService">
													<input name="serviceId" type="hidden" value={service.id} />
													<button
														class="inline-flex h-9 items-center justify-center rounded-md border border-red-300 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
														onclick={(event) => {
															if (!confirm('Remove this service?')) {
																event.preventDefault();
															}
														}}
														type="submit"
													>
														Delete
													</button>
												</form>
												<span class="inline-flex items-center text-xs text-zinc-500">
													{service.online ? 'Online' : 'Offline'}
												</span>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</article>
					{/each}
				</section>
			{/if}
		</div>
	{/if}
</main>
