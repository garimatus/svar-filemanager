<script lang="ts">
	import type { IApi } from '@svar-ui/filemanager-store'
	import TableView from './Table/View.svelte'
	import { getContext } from 'svelte'
	import { setID } from '@svar-ui/lib-dom'
	import type { IPublicWritable } from '@svar-ui/lib-state'
	import type { TActivePanel } from '@svar-ui/filemanager-store/dist/types/types'

	const api: IApi = getContext('filemanager-store')
	const activePanel: IPublicWritable<TActivePanel> =
		api.getReactiveState().activePanel

	function toggleActive(panel: TActivePanel): void {
		api.exec('set-active-panel', { panel })
	}
</script>

<div class="wx-panels" data-id={setID('body')}>
	<div class="wx-item" data-panel={0}>
		<TableView
			panel={0}
			active={$activePanel == 0}
			onclick={() => toggleActive(0)}
			oncontextmenu={() => toggleActive(0)}
		/>
	</div>
	<div class="wx-item" data-panel={1}>
		<TableView
			panel={1}
			active={$activePanel == 1}
			onclick={() => toggleActive(1)}
			oncontextmenu={() => toggleActive(1)}
		/>
	</div>
</div>

<style>
	.wx-panels {
		display: flex;
		width: 100%;
		max-width: 100%;
		height: 100%;
	}
	.wx-item {
		flex-grow: 1;
		flex-shrink: 0;
		width: calc(50% - 10px);
	}
	.wx-item:first-child {
		margin-right: 10px;
	}
</style>
