import { locateAttr } from '@svar-ui/lib-dom'

import type {
	TID,
	TActivePanel,
	IPanel,
	IParsedEntity,
	IMenuOption,
	IHotkeysConfig,
} from './types'
import { getParentPath, getSelectionOnNavigation } from './helpers'

export function hotkeys(
	node: HTMLElement,
	config: IHotkeysConfig
): { destroy: () => void } {
	const { api }: { api: IHotkeysConfig['api'] } = config

	function handleHotkey(hotkey: string, e: KeyboardEvent): void {
		const panel: IPanel = config.getPanel() as IPanel
		const selected: TID[] = panel.selected ?? []

		const ctrl: boolean = e.ctrlKey || e.metaKey
		const shift: boolean = e.shiftKey

		let options: IMenuOption[] = []
		const item: IParsedEntity | null = selected[0]
			? ((api.getFile(selected[0]) as IParsedEntity | undefined) ?? null)
			: null

		if (selected.length > 0) {
			if (selected.length > 1) options = config.menuOptions('multiselect') ?? []
			else options = config.menuOptions(item?.type, item) ?? []
		} else {
			options = config.menuOptions('body') ?? []
		}

		const hotkeysCombo: string = `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${hotkey}`
		const option: IMenuOption | undefined = options.find(
			(o: IMenuOption) => o.hotkey?.toLowerCase() === hotkeysCombo
		)
		const action: IHotkeysConfig['performAction'] = config.performAction

		if (option) {
			switch (hotkeysCombo) {
				case 'ctrl+c':
					action('copy')
					break
				case 'ctrl+x':
					action('move')
					break
				case 'ctrl+v':
					action('paste', item)
					break
				case 'delete':
					action('delete')
					break
				case 'ctrl+r':
					e.preventDefault()
					action('rename', item)
					break
				case 'ctrl+d':
					e.preventDefault()
					action('download', item)
					break
				default:
					option.handler?.({ context: item })
			}
		}

		switch (hotkey) {
			case 'enter': {
				if (ctrl || shift) break
				const { _crumbs: crumbs, _selectNavigation: selectNavigation } = panel

				if (selectNavigation) {
					const path: TID | null = getParentPath(crumbs)
					if (path) {
						const selection: TID | null = getSelectionOnNavigation(path, crumbs)
						api.exec('set-path', {
							id: path,
							...(selection ? { selected: [selection] } : {}),
						})
					}
				} else if (selected.length === 1) {
					const selectedItem: IParsedEntity | undefined = api.getFile(
						selected[0]
					) as IParsedEntity | undefined
					if (selectedItem) {
						api.exec(
							selectedItem.type === 'folder' ? 'set-path' : 'open-file',
							{
								id: selectedItem.id,
							}
						)
					}
				}
				break
			}

			case 'arrowup':
			case 'arrowleft': {
				const {
					_files: files,
					_selected: selectedFiles,
					path,
					_selectNavigation: selectNavigation,
				} = panel

				let nextId: TID | undefined

				if (selectedFiles.length > 0) {
					const start: TID | undefined = selectedFiles.at(0)?.id
					const currentIndex: number = files.findIndex(
						(file: IParsedEntity) => file.id === start
					)

					if (currentIndex !== -1) {
						const next: number = currentIndex - 1
						if (files[next]) nextId = files[next].id
						else if (path !== '/' && !(ctrl || shift)) {
							api.exec('select-file', { type: 'navigation' })
						}
					}
				} else {
					if (selectNavigation) break
					if (path !== '/') {
						api.exec('select-file', { type: 'navigation' })
						break
					}
					nextId = files.at(0)?.id
				}

				if (nextId) {
					api.exec('select-file', {
						id: nextId,
						toggle: ctrl,
						range: shift,
					})
				}
				break
			}

			case 'arrowdown':
			case 'arrowright': {
				const {
					_files: files,
					_selected: selectedFiles,
					path,
					_selectNavigation: selectNavigation,
				} = panel

				let nextId: TID | undefined

				if (selectedFiles.length > 0) {
					const start: TID | undefined = selectedFiles.at(-1)?.id
					const currentIndex: number = files.findIndex(
						(file: IParsedEntity) => file.id === start
					)
					if (currentIndex !== -1) {
						const next: number = currentIndex + 1
						if (files[next]) nextId = files[next].id
					}
				} else {
					if (path !== '/' && !selectNavigation) {
						api.exec('select-file', { type: 'navigation' })
						break
					}
					nextId = files.at(0)?.id
				}

				if (nextId) {
					api.exec('select-file', {
						id: nextId,
						toggle: ctrl,
						range: shift,
					})
				}
				break
			}
		}
	}

	function handleKeydown(e: KeyboardEvent): void {
		const code: string = e.code.replace('Key', '').toLowerCase()
		handleHotkey(code, e)

		// tracking active panel
		if (code === 'tab') {
			setTimeout((): void => {
				const active: Element | null = document.activeElement
				if (!(active instanceof HTMLElement)) return
				if (!active.className.includes('table')) return

				const panelAttr: string | null = locateAttr(active, 'data-panel')
				if (!panelAttr) return

				api.exec('set-active-panel', {
					panel: Number(panelAttr) as TActivePanel,
				})
			})
		}
	}

	node.addEventListener('keydown', handleKeydown)

	return {
		destroy: () => {
			node.removeEventListener('keydown', handleKeydown)
		},
	}
}
