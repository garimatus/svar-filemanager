<script lang="ts">
	import type { IRow } from '@svar-ui/svelte-grid'
	import { getContext, type Component } from 'svelte'
	import { type LucideProps, MoveLeft } from '@lucide/svelte'

	let { row }: { row: IRow } = $props()

	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')
	const { templates }: { templates: any } = getContext('filemanager-store')

	const Icon: Component<LucideProps> = $derived(templates.icon(row, 'small'))
</script>

<div class="wx-name-cell">
	{#if row.id === '/wx-filemanager-parent-link'}
		<i>
			<MoveLeft />
		</i>

		<span class="wx-name"> {_('Back to parent folder')}</span>
	{:else}
		{#if Icon}
			<span class="wx-icon">
				<Icon />
			</span>
		{:else}<i class="wxi-{row.type}"></i>{/if}
		<span class="wx-name"> {row.name} </span>
	{/if}
</div>

<style>
	.wx-name-cell {
		padding: 0 4px;
		display: flex;
		align-items: center;
		height: 100%;
		overflow: hidden;
		flex-shrink: 0;
		text-overflow: clip;
	}
	i,
	.wx-icon {
		margin-right: 10px;
		display: flex;
		align-items: center;
		color: var(--wx-color-primary);
	}

	i {
		font-size: 24px;
		color: var(--wx-color-primary);
	}
	.wx-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
