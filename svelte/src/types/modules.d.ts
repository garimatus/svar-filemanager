declare module '@svar-ui/svelte-uploader' {
	import type { Component } from 'svelte'

	export const apiKey: string | symbol

	export const Uploader: Component<{
		apiOnly?: boolean
		uploadURL?: (...args: any[]) => any
		api?: Record<string, any>
		children?: () => any
	}>
}
