<script lang="ts">
	import type { IApi, TMode } from '@svar-ui/filemanager-store'
	import { getContext } from 'svelte'
	import { delegateClick, setID } from '@svar-ui/lib-dom'
	import Item from './Item.svelte'
	import type { IPublicWritable, TID } from '@svar-ui/lib-state'
	import type {
		IPanel,
		TActivePanel,
		IParsedEntity,
	} from '@svar-ui/filemanager-store/dist/types/types'

	const api: IApi = getContext('filemanager-store')
	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')

	let {
		panels,
		activePanel,
		mode,
	}: {
		panels?: IPublicWritable<Partial<IPanel>[]>
		activePanel?: IPublicWritable<TActivePanel>
		mode?: IPublicWritable<TMode>
	} = api.getReactiveState()

	const files: IParsedEntity[] = $derived($panels[$activePanel]._files)
	const selected: string[] | null = $derived($panels[$activePanel].selected)
	const path: string = $derived($panels[$activePanel].path)
	const crumbs: IParsedEntity[] = $derived($panels[$activePanel]._crumbs)
	const selectNavigation: boolean = $derived(
		$panels[$activePanel]._selectNavigation
	)

	function click(id: TID, e: KeyboardEvent | MouseEvent): void {
		const ctrl: boolean = e && (e.ctrlKey || e.metaKey)
		const shift: boolean = e && e.shiftKey

		if (id === '/wx-filemanager-parent-link') {
			if (selected.length && (ctrl || shift)) return
			api.exec('select-file', {
				type: 'navigation',
			})
			return
		}

		const isFile: boolean = id !== 'body'
		let newSelection: TID | null = !isFile && e ? null : id

		const actionClick: boolean =
			(e.target as HTMLElement).className.indexOf('wx-more') !== -1 ||
			(e.target as HTMLElement).className.indexOf('wxi-dots-v') !== -1

		api.exec('select-file', {
			id: newSelection?.toString(),
			toggle: ctrl && !actionClick,
			range: shift && !actionClick,
			panel: $activePanel,
		})
	}
	function backToParent(): void {
		if (crumbs.length > 1) {
			api.exec('set-path', {
				id: crumbs[crumbs.length - 2].id,
				panel: $activePanel,
				selected: [crumbs[crumbs.length - 1].id],
			})
		}
	}
	function dblclick(id: TID): void {
		if (id === '/wx-filemanager-parent-link') {
			return backToParent()
		}

		if ($mode === 'search') {
			api.exec('filter-files', {
				text: '',
			})
		}

		const item: IParsedEntity | undefined = files.find(a => a.id === id)

		if (item) {
			if (item.type == 'folder') {
				api.exec('set-path', {
					id: item.id,
					panel: $activePanel,
				})
			} else {
				api.exec('open-file', {
					id: item.id,
				})
			}
		}
	}

	function applySelection(id: TID, ev: KeyboardEvent | MouseEvent): void {
		if (
			!selected?.length ||
			!selected.filter((i: string) => i![id] === id).length
		) {
			click(id, ev)
		}
	}

	let renderedFiles: (
		| IParsedEntity
		| {
				id?: string
				name: any
				navigation: boolean
		  }
	)[] = $derived(
		path !== '/'
			? [
					{
						id: '/wx-filemanager-parent-link',
						name: _('Back to parent folder'),
						navigation: selectNavigation,
					},
					...files,
				]
			: files
	)
</script>

{#if $mode == 'search' && !renderedFiles.length}
	<div class="wx-not-found">
		<div class="wx-not-found-text">{_('Looks like nothing is here')}</div>
	</div>
{:else}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		tabindex="0"
		class="wx-cards"
		class:wx-has-back-link={path !== '/' && $mode !== 'search'}
		data-id={setID('body')}
		use:delegateClick={{ click, dblclick, context: applySelection }}
	>
		{#each renderedFiles as child}
			<Item item={child} />
		{/each}
	</div>
{/if}

<style>
	.wx-cards {
		flex-grow: 1;
		flex-wrap: wrap;
		height: 100%;
		border-top: none;
		padding: 30px 20px 10px;
		display: flex;
		align-items: flex-start;
		overflow-y: auto;
		align-content: flex-start;
		outline: none;
	}
	.wx-cards.wx-has-back-link {
		padding: 0 20px 10px;
	}
	.wx-not-found-text {
		text-align: center;
		color: var(--wx-color-font-alt);
	}
	.wx-not-found {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 5px;
		height: 100%;
	}
</style>
