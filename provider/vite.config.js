// vite.config.ts
import { env } from 'node:process'
import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import dts from 'vite-plugin-dts'
import { waitChanges, waitOn } from '@svar-ui/vite-tools'

const __dirname = new URL('.', import.meta.url).pathname
export default async ({ mode }) => {
	import.meta.env = { ...env, ...loadEnv(mode, import.meta.url, 'WX') }

	const files =
		mode === 'production' ? [] : [resolve(__dirname, '../store/dist/index.js')]

	const config = {
		build: {
			lib: {
				entry: resolve(__dirname, 'src/index.ts'),
				name: 'provider',
				formats: ['es'],
				fileName: () => `index.js`,
			},
			sourcemap: true,
			minify: false,
			target: 'esnext',
		},
		test: {
			coverage: {
				reporter: ['text'],
			},
		},
		watch: {
			persistent: true,
			include: ['src/**/*.ts', 'src/**/*.js'],
		},
		plugins: [
			waitChanges({ files }),
			dts({ outDir: resolve(__dirname, 'dist/types') }),
		],
	}

	return waitOn({ files }).then(() => defineConfig(config))
}
