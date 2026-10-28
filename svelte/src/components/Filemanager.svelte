<script lang="ts">
	import { setContext } from 'svelte'

	import Layout from './Layout.svelte'

	import { Locale } from '@svar-ui/svelte-core'
	import { en } from '@svar-ui/filemanager-locales'

	// stores
	import { EventBus, EventBusRouter, type IEventBus } from '@svar-ui/lib-state'
	import { DataStore, getMenuOptions } from '@svar-ui/filemanager-store'
	import type { DataStore as DataStoreType } from '@svar-ui/filemanager-store'
	import Modals from './Modals.svelte'
	// import { whitelist } from '../icons'
	import type {
		IDrive,
		IParsedEntity,
		TActivePanel,
		TMode,
		IMenuOption,
		IPanel,
	} from '@svar-ui/filemanager-store/dist/types/types'
	import iconService from '../services/iconService'
	import type { IApi } from '@svar-ui/filemanager-store'

	let {
		data = [],
		mode = 'cards',
		drive = null,
		preview = false,
		panels = [],
		activePanel = 0,
		readonly = false,
		menuOptions = getMenuOptions,
		extraInfo = null,
		init = null,
		// icons = function (file, size) {
		// 	const { type, ext } = file

		// 	if (type === 'folder') return false

		// 	let icon

		// 	if (type && type !== 'file' && whitelist[type]) {
		// 		icon = type
		// 	} else if (ext) {
		// 		icon = whitelist[ext] ? ext : 'file'
		// 	} else icon = 'unknown'

		// 	return `https://cdn.svar.dev/icons/filemanager/vivid/${size}/${icon}.svg`
		// },
		icons = iconService as unknown as (
			file: IParsedEntity,
			size: number
		) => string | false,
		previews = null,
		...restProps
	}: {
		data?: any[]
		mode?: TMode
		drive?: IDrive | null
		preview?: boolean
		panels?: Partial<IPanel[]>
		activePanel?: TActivePanel
		readonly?: boolean
		menuOptions?: (mode: any) => IMenuOption[]
		extraInfo?: any
		init?: ((api: any) => void) | null
		icons?: (file: IParsedEntity, size: number) => string | false
		previews?: ((file: IParsedEntity, size: number) => string | false) | null
		loadData?: ((file: IParsedEntity) => Promise<any>) | null
		[key: `on${string}`]: ((ev: any) => void) | undefined
	} = $props()

	// init stores
	const dataStore: DataStoreType = new DataStore()

	// define event route
	let firstInRoute: EventBus<any, any> = dataStore.in

	const dash: RegExp = /-/g
	let lastInRoute: EventBusRouter<unknown> = new EventBusRouter(
		(a: string, b) => {
			const name = 'on' + a.replace(dash, '')
			if (restProps[name]) {
				restProps[name](b)
			}
		}
	)
	firstInRoute.setNext(lastInRoute)

	// public API
	export const // state
		getState: any = dataStore.getState.bind(dataStore),
		getReactiveState: any = dataStore.getReactive.bind(dataStore),
		getStores = () => ({ data: dataStore }),
		// events
		exec: (name: string, ev: Event) => Promise<any> = firstInRoute.exec,
		setNext = (ev: IEventBus<any>): any =>
			(lastInRoute = lastInRoute.setNext(ev) as EventBusRouter<unknown>),
		intercept = firstInRoute.intercept.bind(firstInRoute),
		on = firstInRoute.on.bind(firstInRoute),
		detach = firstInRoute.detach.bind(firstInRoute),
		//specific
		getFile = (id: string) => dataStore.getFile(id),
		serialize = (id: string) => dataStore.serialize(id)

	const api: IApi = {
		getState,
		getReactiveState,
		getStores,
		exec,
		setNext,
		intercept,
		on,
		detach,
		getFile,
		serialize,
	}

	const none: () => null = () => null
	// common API available in components
	setContext('filemanager-store', {
		getReactiveState: dataStore.getReactive.bind(dataStore),
		exec: firstInRoute.exec.bind(firstInRoute),
		templates: {
			get preview() {
				return previews || none
			},
			get icon() {
				return (icons as unknown) == 'simple' ? none : icons
			},
		},
		getFile: dataStore.getFile.bind(dataStore),
	})

	let init_once: boolean = true
	const reinitStore = () => {
		dataStore.init({
			data,
			mode,
			drive,
			preview,
			panels,
			activePanel,
		})

		if (init_once && init) {
			init(api)
			init_once = false
		}
	}
	reinitStore()
	$effect(reinitStore)
</script>

<Locale words={en} optional={true}>
	<Modals>
		<Layout
			readonly={readonly as never}
			menuOptions={menuOptions as never}
			extraInfo={extraInfo as never}
		/>
	</Modals>
</Locale>
