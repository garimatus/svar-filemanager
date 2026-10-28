<script lang="ts">
	import type { IApi } from '@svar-ui/filemanager-store'
	import { getContext, type Component } from 'svelte'
	import { formatSize } from '@svar-ui/filemanager-store'
	import { delegateClick, dateToString, setID } from '@svar-ui/lib-dom'
	import {
		Grid,
		type ICellProps,
		type IColumnConfig,
	} from '@svar-ui/svelte-grid'
	import Breadcrumbs from '../Breadcrumbs.svelte'
	import NameCell from './NameCell.svelte'
	import UploadDropArea from '../UploadDropArea.svelte'
	import type {
		IPanel,
		IParsedEntity,
		TActivePanel,
		TSort,
		TID,
	} from '@svar-ui/filemanager-store/dist/types/types'
	import type { DateFormatter } from '@types'
	import type { IPublicWritable } from '@svar-ui/lib-state'

	let {
		panel,
		active = false,
		onclick,
		oncontextmenu,
	}: {
		panel: TActivePanel
		active?: boolean
		onclick?: (e: Event) => void
		oncontextmenu?: (e: Event) => void
	} = $props()

	const api: IApi = getContext('filemanager-store')

	const locale: any = getContext('wx-i18n')
	const _: any = locale.getGroup('filemanager')
	const format: DateFormatter = dateToString(
		'%d %M %Y',
		locale.getRaw().calendar
	)

	let { panels }: { panels?: IPublicWritable<Partial<IPanel>[]> } =
		api.getReactiveState()

	const selection: string[] = $derived($panels[panel].selected)
	const path: string = $derived($panels[panel].path)
	const crumbs: IParsedEntity[] = $derived($panels[panel]._crumbs)
	const sorts: { [key: string]: TSort } = $derived($panels[panel]._sorts)
	const selectNavigation: boolean = $derived($panels[panel]._selectNavigation)
	const files: IParsedEntity[] = $derived($panels[panel]._files)

	const columns: IColumnConfig[] = [
		{
			id: 'name',
			header: _('Name'),
			flexgrow: 3,
			sort: true,
			resize: true,
			cell: NameCell as Component<ICellProps, object, keyof ICellProps | ''>,
		},
		{
			id: 'size',
			header: _('Size'),
			width: 100,
			sort: true,
			resize: true,
			template: v => (typeof v === 'number' ? formatSize(v) : ''),
		},
		{
			id: 'date',
			header: _('Date'),
			width: 120,
			sort: true,
			resize: true,
			template: v => (v ? format(v) : ''),
		},
	]

	let sortClick: boolean | null = null
	let resizeClick: boolean | null = null

	const tableSelection: string[] = $derived(
		selectNavigation ? ['/wx-filemanager-parent-link'] : [...selection]
	)

	function click(id: TID, e: Event): void {
		//[FIXME] grip is wx-table classname which may change
		if (e && (e.target as HTMLElement).className.indexOf('wx-grip') !== -1)
			return

		const ctrl: boolean =
			e && ((e as KeyboardEvent).ctrlKey || (e as KeyboardEvent).metaKey)
		const shift: boolean = e && (e as KeyboardEvent).shiftKey

		if (id === '/wx-filemanager-parent-link') {
			if (selection.length && (ctrl || shift)) return
			api.exec('select-file', {
				type: 'navigation',
			})
			return
		}

		const isFile: boolean = id !== 'body'
		let newSelection: string | null = !isFile && e ? null : id

		if (!sortClick && !resizeClick) {
			api.exec('select-file', {
				id: newSelection,
				toggle: ctrl,
				range: shift,
				panel: panel,
			})
		} else sortClick = resizeClick = null
	}

	function backToParent(): void {
		if (crumbs.length > 1) {
			api.exec('set-path', {
				id: crumbs[crumbs.length - 2].id,
				panel: panel,
				selected: [crumbs[crumbs.length - 1].id],
			})
		}
	}

	function dblclick(id: TID): void {
		if (id === '/wx-filemanager-parent-link') {
			return backToParent()
		}
		const item = files.find(a => a.id === id)

		if (item) {
			if (item.type == 'folder') {
				api.exec('set-path', {
					id: item.id,
					panel: panel,
				})
			} else {
				api.exec('open-file', {
					id: item.id,
				})
			}
		}
	}

	function handleSort(e: { key: string }): void {
		const col: string = e.key
		const prevSort: TSort | undefined = sorts[path]
		let order: TSort['order'] = !prevSort ? 'desc' : 'asc'

		if (prevSort && prevSort.key === col) {
			order = prevSort.order === 'asc' ? 'desc' : 'asc'
		}

		api.exec('sort-files', {
			key: col,
			order,
			panel,
			path,
		})
	}

	function initTable(api: IApi): void {
		api.intercept('sort-rows', (e: { key: string }) => {
			sortClick = true
			handleSort(e)
			return false
		})

		api.intercept('select-row', () => false)

		api.on('resize-column', () => (resizeClick = true))

		api.intercept('hotkey', () => false)
	}

	let renderedFiles: IParsedEntity[] | { id: string; name: string }[] =
		$derived(
			path !== '/'
				? [
						{
							id: '/wx-filemanager-parent-link',
							name: _('Back to parent folder'),
						},
						...files,
					]
				: files
		)

	let sortMarks: { [key: string]: { order: TSort['order'] } } = $derived.by(
		() => {
			if (renderedFiles && sorts[path]) {
				const { key, order }: { key: string; order: TSort['order'] } =
					sorts[path]
				return { [key]: { order } }
			}
		}
	)
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {onclick} {oncontextmenu} class="wx-wrapper">
	<Breadcrumbs panel={panel as never} />
	<div
		data-id={setID('body')}
		class="wx-list"
		class:wx-active={active}
		use:delegateClick={{ click, dblclick }}
	>
		<UploadDropArea>
			<Grid
				init={() => initTable}
				data={renderedFiles}
				{columns}
				selectedRows={tableSelection}
				columnStyle={() => 'wx-each-cell'}
				sizes={{ rowHeight: 42, headerHeight: 42 }}
				{sortMarks}
			/>
		</UploadDropArea>
	</div>
</div>

<style>
	.wx-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		max-height: 100%;
		max-width: 100%;
		box-shadow: var(--wx-fm-box-shadow);
		border-radius: 6px;
	}

	.wx-list {
		height: calc(100% - 50px);
	}
	.wx-list > :global(.wx-upload-area .wx-grid) {
		--wx-table-cell-border: var(--wx-fm-grid-border);
		--wx-table-header-border: var(--wx-fm-grid-border);
		--wx-table-header-cell-border: var(--wx-fm-grid-border);
	}
	.wx-list > :global(.wx-upload-area .wx-body .wx-each-cell) {
		border-right: none;
	}
	.wx-list > :global(.wx-upload-area .wx-header .wx-cell:first-child .wx-text) {
		padding: 0 6px;
	}
	.wx-list > :global(.wx-upload-area .wx-table) {
		border-radius: 0 0 6px 6px;
	}

	.wx-list.wx-active > :global(.wx-upload-area .wx-grid),
	.wx-list > :global(.wx-upload-area.wx-active .wx-grid) {
		--wx-table-cell-border: 1px solid var(--wx-color-primary);
	}
	.wx-list.wx-active > :global(.wx-upload-area .wx-row) {
		--wx-table-cell-border: var(--wx-fm-grid-border);
	}

	.wx-list > :global(.wx-upload-area.wx-active .wx-row) {
		background: var(--wx-color-primary-selected);
		--wx-table-cell-border: 1px solid var(--wx-color-primary-selected);
	}
	/*switch off focus due to filamanager own navigation system*/
	.wx-list > :global(.wx-upload-area .wx-grid .wx-cell) {
		outline: none;
	}

	/* temp hack to align toolbar and table body (with 1.75px full match) */
	.wx-list > :global(.wx-upload-area) {
		border-right: 1px solid transparent;
	}
</style>
