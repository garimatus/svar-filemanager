<script lang="ts">
	import { getContext } from 'svelte'
	import { Segmented, TwoState } from '@svar-ui/svelte-core'
	import { setID } from '@svar-ui/lib-dom'
	import Search from './ui/Search.svelte'
	import IconWrapper from './ui/IconWrapper.svelte'
	import type { IApi, TMode } from '@svar-ui/filemanager-store'
	import type { IPublicWritable } from '@svar-ui/lib-state'
	import {
		Table,
		PlayingCardsFan,
		TableColumnsSplit,
		View,
	} from '@lucide/svelte/icons'
	import type { ModeOption } from '@types'

	let {
		narrowMode = false,
		onshowtree,
	}: { narrowMode?: boolean; onshowtree?: () => void } = $props()

	const api: IApi = getContext('filemanager-store')

	const {
		mode,
		preview: info,
		search: searchValue,
	}: {
		mode?: IPublicWritable<TMode>
		preview?: IPublicWritable<boolean>
		search: IPublicWritable<string>
	} = api.getReactiveState()

	const _: any = (getContext('wx-i18n') as any).getGroup('filemanager')

	const options: ModeOption[] = [
		{ icon: Table, id: 'table', label: _('Table') },
		{
			icon: TableColumnsSplit,
			id: 'panels',
			label: _('Panels'),
		},
		{ icon: PlayingCardsFan, id: 'cards', label: _('Cards') },
	]

	function changeMode({ value }: { value: TMode }): void {
		api.exec('set-mode', { mode: value })
	}
	function toggleInfo(e: Event): void {
		e.preventDefault()
		api.exec('show-preview', { mode: !$info })
	}
	function search(e: { value: string }): void {
		api.exec('filter-files', { text: e.value })
	}
</script>

{#snippet modeOption({ option }: { option: ModeOption })}
	<option.icon size={22} />
	<span class="wx-mode-label">{option.label}</span>
{/snippet}

<div class="wx-toolbar">
	<div class="wx-left {narrowMode ? 'wx-left-narrow' : ''}">
		{#if !narrowMode}
			<div class="wx-name">{_('Files')}</div>
		{:else if !($mode == 'panels' || $mode == 'search')}
			<div class="wx-sidebar-icon" data-id={setID('toggle-tree')}>
				<IconWrapper
					onclick={() => onshowtree && onshowtree()}
					name={'subtask'}
				/>
			</div>
		{/if}
		<Search onsearch={search as never} value={$searchValue as never} />
	</div>

	<div class="wx-right">
		<div class="wx-modes">
			<Segmented
				value={$mode}
				options={options as never}
				children={modeOption as never}
				onchange={changeMode}
			/>
		</div>
		{#if !narrowMode}
			<TwoState onclick={toggleInfo} value={$info}>
				<View size={22} />
			</TwoState>
		{/if}
	</div>
</div>

<style>
	.wx-toolbar {
		height: var(--wx-fm-toolbar-height);
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 12px;
		max-width: 100%;
		background-color: var(--wx-background);
		box-shadow: var(--wx-fm-box-shadow);
		gap: 8px;
	}

	.wx-left,
	.wx-right {
		display: flex;
	}

	.wx-left {
		align-items: center;
		width: 35%;
		justify-content: space-between;
	}
	.wx-left-narrow {
		width: 70%;
	}
	.wx-name {
		margin-right: 20px;
		font-size: 16px;
		font-weight: var(--wx-font-weight-md);
	}

	.wx-sidebar-icon {
		margin-right: 20px;
	}

	.wx-mode-label {
		margin-left: 4px;
	}

	/*.wx-preview-icon {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-left: 20px;

		--wx-button-icon-size: 22px;
		--wx-button-line-height: 25px;
		--wx-button-padding: 4px 10px;
		--wx-button-border-radius: 6px;
	}

	.wx-preview-icon i {
		position: relative;
		display: inline-block;
		vertical-align: top;
		font-size: var(--wx-button-icon-size);
		line-height: 1;
		height: var(--wx-button-line-height);
	}

	.wx-preview-icon i:before {
		display: block;
		position: relative;
		top: 50%;
		transform: translateY(-50%);
		color: var(--wx-fm-button-font-color);
	}

	.wx-modes {
		--wx-button-font-color: var(--wx-fm-button-font-color);
		--wx-segmented-padding: 1.5px;
		--wx-segmented-background-hover: linear-gradient(
			rgba(0, 0, 0, 0.1) 0%,
			rgba(0, 0, 0, 0.1) 100%
		);
		--wx-button-icon-size: 22px;
		--wx-segmented-border-radius: 6px;
		--wx-segmented-border: none;
	} */
</style>
