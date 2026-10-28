<script lang="ts">
	import { type Component, getContext } from 'svelte'

	import { Button } from '@svar-ui/svelte-core'
	import {
		DropDownMenu,
		type IMenuOption,
		registerMenuItem,
	} from '@svar-ui/svelte-menu'

	import Tree from './Tree/Tree.svelte'
	// import Drive from './Drive.svelte'
	import UploadButton from './UploadButton.svelte'

	let {
		readonly,
		menuOptions,
	}: { readonly?: boolean; menuOptions?: (id: string) => IMenuOption[] } =
		$props()

	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')
	const { showPrompt }: { showPrompt: (options: any) => void } =
		getContext('filemanager-modals')

	registerMenuItem(
		'upload',
		UploadButton as unknown as Component<
			{ option?: any },
			object,
			'' | 'option'
		>
	)

	function handleClick({ action }: { action: IMenuOption }) {
		if (action) {
			if (action.id === 'add-file')
				showPrompt({
					item: {
						type: 'file',
						size: 0,
						date: new Date(),
					},
					add: true,
				})
			else if (action.id === 'add-folder')
				showPrompt({
					item: {
						type: 'folder',
						date: new Date(),
					},
					add: true,
				})
		}
	}

	let options: IMenuOption[] = $derived(
		menuOptions('add').map((option: IMenuOption) => {
			option.text = _(option.text)
			return option
		})
	)
</script>

<div class="wx-wrapper">
	{#if !readonly}
		<div class="wx-button">
			<DropDownMenu {options} at="bottom-fit" onclick={handleClick}>
				<Button type="primary block">{_('Add New')}</Button>
			</DropDownMenu>
		</div>
	{/if}
	<div class="wx-tree">
		<Tree />
	</div>
	<!-- <Drive /> -->
</div>

<style>
	.wx-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: var(--wx-background);
		border-radius: 6px;
		box-shadow: var(--wx-fm-box-shadow);
	}

	.wx-button {
		padding: 8px 8px 0;
	}

	.wx-tree {
		padding-top: 8px;
		flex-grow: 1;
		overflow-x: auto;
	}
</style>
