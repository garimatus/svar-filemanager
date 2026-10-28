<script lang="ts">
	import type { IApi } from '@svar-ui/filemanager-store'
	import { getContext } from 'svelte'
	import { apiKey } from '@svar-ui/svelte-uploader'
	import { locateAttr } from '@svar-ui/lib-dom'
	import type { IPublicWritable } from '@svar-ui/lib-state'
	import type { TActivePanel } from '@svar-ui/filemanager-store/dist/types/types'

	let { children }: { children?: () => any } = $props()

	const api: IApi = getContext('filemanager-store')
	const activePanel: IPublicWritable<TActivePanel> =
		api.getReactiveState().activePanel

	const uploaderApi: any = getContext(apiKey)

	const apiSettings: {
		selected: () => void
		dragEnter: () => void
		dragLeave: () => void
	} = {
		selected: () => {
			const panel: string | null = locateAttr(self, 'data-panel')
			if (panel && panel != $activePanel.toString()) {
				api.exec('set-active-panel', {
					panel: (Number(panel) * 1) as TActivePanel,
				})
			}
		},
		dragEnter: () => self.classList.toggle('wx-active'),
		dragLeave: () => self.classList.toggle('wx-active'),
	}

	let self: any = $state()
</script>

<div
	class="wx-upload-area"
	class:wx-active={false}
	bind:this={self}
	use:uploaderApi.droparea={{ ...apiSettings }}
>
	{@render children?.()}
</div>

<style>
	.wx-upload-area {
		height: 100%;
	}
	.wx-upload-area.wx-active {
		background: var(--wx-color-primary-selected);
	}
</style>
