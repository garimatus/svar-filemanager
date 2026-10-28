<script lang="ts">
	import type { IApi, IParsedEntity } from '@svar-ui/filemanager-store'
	import { clickOutside, locateID, setID } from '@svar-ui/lib-dom'
	import {
		ActionMenu,
		ContextMenu,
		type IMenuOption,
		type IMenuOptionClick,
	} from '@svar-ui/svelte-menu'
	import { Uploader } from '@svar-ui/svelte-uploader'
	import { hotkeys } from '@svar-ui/filemanager-store'

	import { getContext, tick } from 'svelte'

	import SearchView from './SearchView.svelte'
	import Info from './Info.svelte'
	import Panels from './Panels.svelte'
	import Sidebar from './Sidebar.svelte'
	import Toolbar from './Toolbar.svelte'
	import TableView from './Table/View.svelte'
	import CardsView from './Cards/View.svelte'

	import type { IPanel } from '@svar-ui/filemanager-store/dist/types/types'

	let {
		readonly = false,
		menuOptions,
		extraInfo,
	}: {
		readonly?: boolean
		menuOptions: (s?: string, item?: IParsedEntity) => IMenuOption[]
		extraInfo: any
	} = $props()

	let sidebarWidth: number = $state()

	let narrowMode: boolean = $state(false)
	let showSidebar: boolean = $state(false)

	function resize(node: Element): void {
		const ro: ResizeObserver = new ResizeObserver(
			(entries: ResizeObserverEntry[]) => {
				narrowMode = entries[0].borderBoxSize[0].inlineSize < 768
			}
		)
		ro.observe(node)
	}

	function toggleSidebar(): void {
		showSidebar = !showSidebar
	}

	function hideSidebar(ev: Event): void {
		if (narrowMode && locateID(ev) !== 'toggle-tree') {
			showSidebar = false
		}
	}

	const api: IApi = getContext('filemanager-store')
	const {
		showPrompt,
		showConfirm,
	}: {
		showPrompt: (config: { item: any; add?: boolean }) => void
		showConfirm: (config: { selected: string[] }) => void
	} = getContext('filemanager-modals') as any
	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')

	const {
		mode: rMode,
		preview: rPreview,
		activePanel: rActivePanel,
		panels: rPanels,
	} = api.getReactiveState()

	const selected: string[] = $derived($rPanels[$rActivePanel].selected)
	const path: string = $derived($rPanels[$rActivePanel].path)
	let contextMenuOptions: IMenuOption[] = $state([])

	const previewOption: IMenuOption = {
		icon: 'wxi-eye',
		text: 'Preview',
		id: 'preview',
	}

	function getReadonlyMenu(type: string): IMenuOption[] {
		let options: IMenuOption[] = narrowMode ? [previewOption] : []
		if (type === 'file')
			options = [
				...options,
				...menuOptions().filter((o: IMenuOption) => o.id === 'download'),
			]
		return options
	}

	function resolveContext(id: string, e: Event): IParsedEntity | object {
		const item: IParsedEntity | null = id ? api.getFile(id) : null
		const inTree: Element | null = (e.target as HTMLElement).closest(
			'.tree-item.folder'
		)

		let options: IMenuOption[]

		if (readonly) {
			options = getReadonlyMenu(item?.type)
		} else {
			switch (id) {
				case 'body':
					options = menuOptions(id)
					break
				default:
					if (item) {
						if (!inTree && selected.length > 1) {
							options = narrowMode
								? [previewOption, ...menuOptions('multiselect')]
								: menuOptions('multiselect')
						} else if (id === '/') {
							options = menuOptions('folder', item).filter(
								o => o.id === 'paste'
							)
						} else {
							const mOptions = menuOptions(item.type, item)
							if (mOptions) {
								options = narrowMode ? [previewOption, ...mOptions] : mOptions
							}
						}
					}
			}
			if ($rMode === 'search') {
				options = options?.filter(o => o.id !== 'paste')
			}
		}

		if (
			item?.id &&
			(!selected.length || !selected.some(i => i === item.id)) &&
			!inTree
		) {
			api.exec('select-file', { id: item.id })
		}

		if (options?.length) {
			options.forEach((o: IMenuOption) => {
				if (inTree) o.hotkey = ''
				if (o.text) o.text = _(o.text)
				if (o.hotkey) o.subtext = o.hotkey
			})
			contextMenuOptions = options
			return item || {}
		}
	}

	let copy: { action: string; ids: string[] } | null = null
	function handleMenu(e: IMenuOptionClick): void {
		const { action, context }: { action?: IMenuOption | null; context?: any } =
			e
		if (action) {
			performAction(action.id.toString(), context, !action.hotkey as boolean)
		}
	}

	function performAction(
		action: string,
		context: IParsedEntity,
		inTree: boolean
	): void {
		const ids: string[] = inTree ? [context.id] : selected
		switch (action) {
			case 'download':
				api.exec('download-file', { id: context.id })
				break
			case 'copy':
			case 'move':
				copy = {
					action,
					ids: ids,
				}
				break
			case 'paste':
				if (copy) {
					api.exec(copy.action === 'copy' ? 'copy-files' : 'move-files', {
						ids: copy.ids,
						target: context?.type === 'folder' ? context.id : path,
					})
				}
				break
			case 'rename':
				showPrompt({ item: context })
				break
			case 'delete':
				showConfirm({ selected: ids })
				break
			case 'preview':
				api.exec('show-preview', { mode: !$rPreview })
				break
		}
	}

	function getPanel(): Partial<IPanel> {
		return $rPanels[$rActivePanel]
	}

	async function handleUpload(f: { file: File }): Promise<void> {
		//if active panel was changed before upload, wait until for it
		await tick()
		const { name, size }: { name: string; size: number } = f.file

		api.exec('create-file', {
			file: {
				name,
				size,
				date: new Date(),
				file: f.file,
			},
			parent: path,
		})
	}
</script>

<div
	class="wx-filemanager wx-flex"
	use:resize
	use:hotkeys={{
		api,
		menuOptions: readonly ? getReadonlyMenu : menuOptions,
		performAction,
		getPanel,
	}}
>
	{#if narrowMode && $rPreview}
		<div class="wx-info-narrow">
			<Info {narrowMode} {extraInfo} />
		</div>
	{:else}
		<Toolbar {narrowMode} onshowtree={toggleSidebar} />
		<ContextMenu
			dataKey={'id'}
			at={'point'}
			options={contextMenuOptions}
			resolver={resolveContext}
			onclick={handleMenu}
		>
			<ActionMenu
				dataKey="actionId"
				options={contextMenuOptions}
				resolver={resolveContext}
				onclick={handleMenu}
			>
				<Uploader apiOnly={true} uploadURL={handleUpload}>
					<div class="wx-content-wrapper wx-flex">
						{#if $rMode !== 'panels' && $rMode !== 'search'}
							<div
								use:clickOutside={hideSidebar}
								class="wx-sidebar"
								class:wx-sidebar-narrow={narrowMode}
								class:wx-sidebar-visible={showSidebar}
								bind:clientWidth={sidebarWidth}
							>
								<Sidebar {readonly} {menuOptions} />
							</div>
							<div
								class="wx-content"
								style="width: calc(100% - {sidebarWidth}px - 10px)"
							>
								<div
									class="wx-content-item{$rPreview ? '' : '-fit'}"
									data-id={setID('body')}
								>
									{#if $rMode === 'table'}
										<TableView panel={$rActivePanel} />
									{:else}
										<CardsView />
									{/if}
								</div>
								{#if $rPreview}
									<div class="wx-info">
										<Info {extraInfo} {narrowMode} />
									</div>
								{/if}
							</div>
						{:else}
							<div class="wx-content-item{$rPreview ? '' : '-fit'}">
								{#if $rMode === 'panels'}
									<Panels />
								{:else}
									<SearchView />
								{/if}
							</div>
							{#if $rPreview}
								<div class="wx-info">
									<Info {extraInfo} {narrowMode} />
								</div>
							{/if}
						{/if}
					</div>
				</Uploader>
			</ActionMenu>
		</ContextMenu>
	{/if}
</div>

<style>
	.wx-flex {
		display: flex;
		width: 100%;
	}
	.wx-filemanager {
		max-width: 100vw;
		max-height: 100vh;
		overflow: hidden;
		background-color: var(--wx-fm-background);
		flex-direction: column;
		height: 100%;
	}
	.wx-content {
		flex-grow: 1;
		display: flex;
		flex-shrink: 0;
	}
	.wx-content-item-fit {
		width: 100%;
		padding: 0 10px 10px;
	}
	.wx-content-item {
		width: 67%;
		padding: 0 10px 10px;
	}
	.wx-content-wrapper {
		margin-top: 10px;
		max-width: 100%;
		max-height: 100%;
		position: relative;
	}
	.wx-info {
		width: 38%;
	}
	.wx-sidebar {
		flex: 0 0 auto;
		width: 238px;
		padding: 0 10px 10px;
		height: 100%;
	}
	.wx-sidebar-narrow {
		position: absolute !important;
		z-index: 5;
		left: -300px;
		transition-duration: 0.6s;
	}
	.wx-sidebar-visible {
		left: 0;
	}
	.wx-info-narrow {
		width: 100%;
		height: 100%;
		padding-top: 10px;
	}
	.wx-filemanager > :global(div[data-menu-ignore='true']) {
		height: 100%;
		width: 100%;
	}
	.wx-filemanager > :global(span[data-menu-ignore='true']),
	.wx-filemanager
		> :global(span[data-menu-ignore='true'])
		> :global(span[data-menu-ignore='true']) {
		min-height: 0;
		height: 100%;
		width: 100%;
		display: flex;
	}
</style>
