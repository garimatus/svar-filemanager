<script lang="ts">
	import type { IApi } from '@svar-ui/filemanager-store'
	import { getContext } from 'svelte'
	import { delegateClick } from '@svar-ui/lib-dom'
	import Folder from './Folder.svelte'
	import { getSelectionOnNavigation } from '@svar-ui/filemanager-store'
	import type { IPublicWritable } from '@svar-ui/lib-state'
	import type FileTree from '@svar-ui/filemanager-store/dist/types/FileTree'
	import type {
		IPanel,
		IParsedEntity,
		TActivePanel,
		TID,
	} from '@svar-ui/filemanager-store/dist/types/types'

	const api: IApi = getContext('filemanager-store')
	const {
		data,
		panels,
		activePanel,
	}: {
		data?: IPublicWritable<FileTree>
		panels?: IPublicWritable<Partial<IPanel>[]>
		activePanel?: IPublicWritable<TActivePanel>
	} = api.getReactiveState()

	const crumbs: IParsedEntity[] = $derived($panels[$activePanel]._crumbs)

	function toggle(id: TID): void {
		api.exec('open-tree-folder', {
			id,
			mode: !$data.byId(id).open,
		})
	}

	function click(id: TID): void {
		const selectedId: TID | null = getSelectionOnNavigation(id, crumbs)
		api.exec('set-path', {
			id,
			panel: $activePanel,
			...(selectedId && { selected: [selectedId] }),
		})
	}

	let folders: IParsedEntity[] = $state([] as IParsedEntity[])
	$effect(() => {
		folders = $data.byId(0).data
	})
</script>

<ul use:delegateClick={{ click, toggle }}>
	{#each folders as folder (folder.id)}
		{#if folder.type === 'folder'}
			<Folder {folder} />
		{/if}
	{/each}
</ul>

<style>
	ul {
		padding: 0;
		margin: 0;
		height: 100%;
		min-width: 100%;
		width: fit-content;
	}
</style>
