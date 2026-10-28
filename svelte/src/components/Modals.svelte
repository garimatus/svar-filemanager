<script lang="ts">
	import type { IApi } from '@svar-ui/filemanager-store'
	import { getContext, setContext } from 'svelte'
	import { Globals, Modal, Text } from '@svar-ui/svelte-core'
	import type {
		IPanel,
		TActivePanel,
	} from '@svar-ui/filemanager-store/dist/types/types'
	import type { IPublicWritable } from '@svar-ui/lib-state'

	let { children }: { children?: () => any } = $props()

	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')
	const api: IApi = getContext('filemanager-store')

	const {
		panels: rPanels,
		activePanel: rActivePanel,
	}: {
		panels?: IPublicWritable<Partial<IPanel>[]>
		activePanel?: IPublicWritable<TActivePanel>
	} = api.getReactiveState()

	const path: string = $derived($rPanels[$rActivePanel].path)
	let prompt: { item: any; add?: boolean } | null = $state(null)
	let confirm: { selected: string[] } | null = $state(null)
	let value: string = $state('')
	let initialName: string = $state('')
	let error: boolean = $state(false)

	function promptOk(): void {
		const name: string = value.trim()
		if (!name) {
			error = true
			return
		}

		if (prompt.add) {
			api.exec('create-file', {
				file: {
					...prompt.item,
					name,
				},
				parent: path,
			})
		} else {
			if (initialName !== name)
				api.exec('rename-file', { id: prompt.item.id, name })
		}

		closePrompt()
	}

	function closePrompt(): void {
		prompt = error = null
		initialName = value = ''
	}

	function confirmOk(): void {
		api.exec('delete-files', { ids: confirm.selected })
		confirm = null
	}

	setContext('filemanager-modals', {
		showPrompt(config: { item: any; add?: boolean }) {
			initialName = value =
				config.item.name ||
				(config.item.type === 'folder'
					? _('New folder')
					: `${_('New file')}.txt`)
			prompt = { ...config }
		},
		showConfirm(config: { selected: string[] }) {
			confirm = { ...config }
		},
	})
</script>

<Globals>
	{@render children?.()}
</Globals>

{#if prompt}
	<Modal
		title={_(`Enter ${prompt.item.type} name`)}
		onconfirm={promptOk}
		oncancel={closePrompt}
	>
		<!-- [todo] add selection mask to exclude extensions as a Text feature -->
		<Text {error} select={true} focus={true} bind:value />
	</Modal>
{/if}

{#if confirm}
	<Modal
		title={_('Are you sure you want to delete these items:')}
		onconfirm={confirmOk}
		oncancel={() => (confirm = null)}
	>
		{#if confirm.selected}
			<ul class="wx-list">
				{#each confirm.selected as item}
					<li>{item}</li>
				{/each}
			</ul>
		{/if}
	</Modal>
{/if}

<style>
	.wx-list {
		text-align: left;
		padding-left: 20px;
		max-height: 300px;
		overflow: auto;
	}

	.wx-list li {
		font-weight: var(--wx-font-weight-md);
	}
</style>
