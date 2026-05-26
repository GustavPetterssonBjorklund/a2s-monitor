<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	let { data } = $props();
	let now = $state(Date.now());

	onMount(() => {
		const timer = setInterval(() => {
			now = Date.now();
		}, 250);

		return () => clearInterval(timer);
	});

	const formatSeconds = (value: number) => `${Math.max(0, Math.ceil(value / 1000))}s`;

	const formatTime = (value: Date | string | null) => {
		if (!value) return 'Never';

		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		}).format(new Date(value));
	};

	const nextPollLabel = $derived.by(() => {
		const intervalMs = data.poll?.intervalMs ?? 5_000;
		const loadedAt = data.loadedAt ?? now;
		const elapsedMs = Math.max(0, now - loadedAt);
		const remainingMs = intervalMs - (elapsedMs % intervalMs);

		return `Next background update in ${formatSeconds(remainingMs)}`;
	});
</script>

<svelte:head>
	<title>A2S Monitor</title>
</svelte:head>

<main class="min-h-screen bg-zinc-100 text-zinc-950">
	<div class="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:gap-8 sm:px-8 sm:py-6">
		<header
			class="flex flex-col gap-4 border-b border-zinc-300 pb-5 lg:flex-row lg:items-end lg:justify-between"
		>
			<div>
				<p class="text-sm font-medium tracking-wide text-emerald-700 uppercase">A2S Monitor</p>
				<h1 class="mt-1 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
					Projects
				</h1>
			</div>

			<div class="flex flex-col items-start gap-2">
				<p class="text-sm text-zinc-600">{nextPollLabel}</p>
				<a class="text-sm font-medium text-zinc-700 hover:text-zinc-950" href={resolve('/admin')}
					>Admin</a
				>
			</div>
		</header>

		{#if data.projects.length === 0}
			<section
				class="border border-dashed border-zinc-300 bg-white px-5 py-10 text-center text-sm text-zinc-600"
			>
				No projects yet.
			</section>
		{:else}
			<section class="grid gap-8">
				{#each data.projects as project (project.id)}
					<article class="grid gap-4 border-b border-zinc-300 pb-6 sm:pb-8">
						<div class="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<h2 class="text-lg font-semibold text-zinc-950 sm:text-xl">{project.name}</h2>
								{#if project.description}
									<p class="mt-1 max-w-3xl text-sm text-zinc-600">{project.description}</p>
								{/if}
							</div>
						</div>

						{#if project.services.length === 0}
							<p class="bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">No services.</p>
						{:else}
							<div class="grid gap-3 md:hidden">
								{#each project.services as service (service.id)}
									<div class="bg-white p-4 text-sm shadow-sm">
										<div class="flex items-start justify-between gap-3">
											<div class="min-w-0">
												<h3 class="truncate font-medium text-zinc-950">{service.name}</h3>
											</div>
											<span
												class={[
													'shrink-0 rounded px-2 py-1 text-xs font-semibold',
													service.online
														? 'bg-emerald-100 text-emerald-800'
														: 'bg-red-100 text-red-800'
												]}
											>
												{service.online ? 'Online' : 'Offline'}
											</span>
										</div>

										<dl class="mt-4 grid grid-cols-2 gap-x-4">
											<div>
												<dt class="text-xs font-medium text-zinc-500 uppercase">Map</dt>
												<dd class="mt-1 break-words text-zinc-700">{service.map ?? 'Unknown'}</dd>
											</div>
											<div>
												<dt class="text-xs font-medium text-zinc-500 uppercase">Players</dt>
												<dd class="mt-1 text-zinc-700">
													{service.players ?? '-'} / {service.maxPlayers ?? '-'}
												</dd>
											</div>
										</dl>
									</div>
								{/each}
							</div>

							<div class="hidden overflow-x-auto bg-white shadow-sm md:block">
								<table class="min-w-full divide-y divide-zinc-200 text-left text-sm">
									<thead class="bg-zinc-50 text-xs text-zinc-600 uppercase">
										<tr>
											<th class="px-4 py-3 font-semibold">Service</th>
											<th class="px-4 py-3 font-semibold">Status</th>
											<th class="px-4 py-3 font-semibold">Server</th>
											<th class="px-4 py-3 font-semibold">Map</th>
											<th class="px-4 py-3 font-semibold">Players</th>
											<th class="px-4 py-3 font-semibold">Checked</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-zinc-200">
										{#each project.services as service (service.id)}
											<tr>
												<td class="px-4 py-3 align-top">
													<div class="font-medium text-zinc-950">{service.name}</div>
													<div class="text-xs text-zinc-500">{service.host}:{service.port}</div>
													{#if service.queryPort && service.queryPort !== service.port}
														<div class="text-xs text-zinc-500">
															Query {service.queryPort}
														</div>
													{/if}
												</td>
												<td class="px-4 py-3 align-top">
													<span
														class={[
															'inline-flex rounded px-2 py-1 text-xs font-semibold',
															service.online
																? 'bg-emerald-100 text-emerald-800'
																: 'bg-red-100 text-red-800'
														]}
													>
														{service.online ? 'Online' : 'Offline'}
													</span>
												</td>
												<td class="px-4 py-3 align-top">
													<div class="max-w-72 truncate text-zinc-900">
														{service.serverName ?? service.game ?? 'Unknown'}
													</div>
													{#if service.game && service.serverName}
														<div class="text-xs text-zinc-500">{service.game}</div>
													{/if}
												</td>
												<td class="px-4 py-3 align-top text-zinc-700">{service.map ?? 'Unknown'}</td
												>
												<td class="px-4 py-3 align-top text-zinc-700">
													{service.players ?? '-'} / {service.maxPlayers ?? '-'}
												</td>
												<td class="px-4 py-3 align-top text-zinc-600">
													{formatTime(service.lastCheckedAt)}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						{/if}
					</article>
				{/each}
			</section>
		{/if}
	</div>
</main>
