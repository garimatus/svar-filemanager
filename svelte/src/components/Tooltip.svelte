<script lang="ts">
	import { Tooltip, type TPositionNoFit } from '@svar-ui/svelte-core'
	import { getID } from '@svar-ui/lib-dom'
	import type { IApi, IParsedEntity } from '@svar-ui/filemanager-store'

	let {
		api,
		at = 'point' as TPositionNoFit,
		content: Content,
		overflow = false,
		resolver = defaultResolver,
		...restProps
	}: {
		api?: IApi
		at?: TPositionNoFit
		content?: any
		overflow?: boolean
		resolver?: (element: HTMLElement) => any
	} = $props()

	function defaultResolver(element: HTMLElement) {
		if (!api) return null

		if (element.classList.contains('wx-item')) {
			const id: string = getID(element).toString()
			if (!id) return null
			const file: IParsedEntity | null = api.getFile(id)
			if (!file) return null
			if (overflow) {
				const nameEl = element.querySelector('.wx-name')
				const startEl = nameEl?.firstElementChild
				if (!startEl || startEl.scrollWidth <= startEl.clientWidth) {
					return null
				}
			}
			if (Content) {
				return { api, data: { file } }
			} else {
				return file.name
			}
		}

		return null
	}
</script>

<Tooltip {at} content={Content} {resolver} {...restProps} />
