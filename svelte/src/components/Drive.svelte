<script lang="ts">
	import type { IApi, IDrive } from '@svar-ui/filemanager-store'
	import { getContext } from 'svelte'
	import { formatSize } from '@svar-ui/filemanager-store'
	import { IPublicWritable } from '@svar-ui/lib-state'

	const api: IApi = getContext('filemanager-store')
	const drive: IPublicWritable<IDrive> = api.getReactiveState().drive
	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')

	let used: number = $derived($drive ? $drive.used : 0)
	let total: number = $derived($drive ? $drive.total : 0)
</script>

{#if used && total}
	<div class="wx-drive">
		<progress value={Number(used)} max={Number(total)} class="wx-progress"
		></progress>
		<p>{formatSize(used)} {_('of')} {formatSize(total)} {_('used')}</p>
	</div>
{/if}

<style>
	.wx-drive {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 8px;
	}
	.wx-progress {
		width: 100%;
		height: 8px;
		border-radius: 20px;
		background-color: var(--wx-button-background);
		border: none;
	}
	.wx-progress[value]::-webkit-progress-bar {
		border-radius: 20px;
		background-color: var(--wx-fm-progress-bar-color);
	}
	.wx-progress[value]::-moz-progress-bar {
		background-color: var(--wx-color-primary);
		border-radius: 10px;
	}

	.wx-progress[value]::-webkit-progress-value {
		background-color: var(--wx-color-primary);
		border-radius: 10px;
	}
	.wx-drive p {
		margin: 20px 0;
	}
</style>
