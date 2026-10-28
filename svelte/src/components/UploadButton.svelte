<script lang="ts">
	import { getContext } from 'svelte'
	import { apiKey } from '@svar-ui/svelte-uploader'
	import type { IMenuOption } from '@svar-ui/svelte-menu'

	let { option }: { option: IMenuOption } = $props()

	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')
	const uploaderApi: any = getContext(apiKey)

	function openFileChooserDialog(): void {
		uploaderApi.open({})
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="wx-upload-button" onclick={openFileChooserDialog}>
	<span>{_(option.text)}</span>
</div>

<style>
	.wx-upload-button {
		width: 100%;
	}
</style>
