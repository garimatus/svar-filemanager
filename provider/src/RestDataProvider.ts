import { Rest } from '@svar-ui/lib-data-provider'
import type { ActionMap } from '@svar-ui/lib-data-provider'
import type {
	IDrive,
	TMethodsConfig,
	TID,
	IEntity,
	IFile,
} from '@svar-ui/filemanager-store'

type TProviderMethodsConfig = TMethodsConfig & {
	'upload-file': {
		file: IFile
		parent: TID
	}
	'file-renamed': {
		id: TID
		newId: TID
	}
}

interface ISingleResult {
	result: {
		id: TID
	}
}

interface IMultiResult {
	result: Array<{ id: TID }>
}

export default class RestDataProvider extends Rest<TProviderMethodsConfig> {
	constructor(url: string) {
		super(url)
	}
	getHandlers(): ActionMap<TProviderMethodsConfig> {
		return {
			'create-file': {
				handler: async (ev: unknown) => {
					const data: TMethodsConfig['create-file'] =
						ev as TMethodsConfig['create-file']
					const res: ISingleResult | null = await this.createFile(
						data.file,
						data.parent
					)
					if (!res) return false
					this.handleNonUniqueNames([res.result.id], [data.newId as TID])
					return res
				},
			},
			'rename-file': {
				handler: async (evData: unknown) => {
					const ev: TMethodsConfig['rename-file'] =
						evData as TMethodsConfig['rename-file']
					return this.send<ISingleResult>(
						`files/${encodeURIComponent(ev.id)}`,
						'PUT',
						this.getParams({
							operation: 'rename',
							name: ev.name,
						})
					).then((res: ISingleResult) => {
						this.handleNonUniqueNames([res.result.id], [ev.newId as TID])
						return res
					})
				},
			},
			'move-files': {
				handler: async (evData: unknown) => {
					const ev: TMethodsConfig['move-files'] =
						evData as TMethodsConfig['move-files']
					return this.send<IMultiResult>(
						'files',
						'PUT',
						this.getParams({
							operation: 'move',
							ids: ev.ids,
							target: ev.target,
						})
					).then((res: IMultiResult) => {
						this.handleNonUniqueNames(
							res.result.map(i => i.id),
							ev.newIds as TID[]
						)
						return res
					})
				},
			},
			'copy-files': {
				handler: async (evData: unknown) => {
					const ev: TMethodsConfig['copy-files'] =
						evData as TMethodsConfig['copy-files']
					return this.send<IMultiResult>(
						'files',
						'PUT',
						this.getParams({
							operation: 'copy',
							ids: ev.ids,
							target: ev.target,
						})
					).then((res: IMultiResult) => {
						this.handleNonUniqueNames(
							res.result.map(i => i.id),
							ev.newIds as TID[]
						)
						return res
					})
				},
			},
			'delete-files': {
				handler: async (evData: unknown) => {
					const ev: TMethodsConfig['delete-files'] =
						evData as TMethodsConfig['delete-files']
					return this.send(
						'files',
						'DELETE',
						this.getParams({
							ids: ev.ids,
						})
					)
				},
			},
		}
	}

	/**
	 * Performs the actual server-side file/folder creation without touching
	 * the UI store. Used directly by callers that want to wait for server
	 * confirmation *before* the entry ever appears in the UI (see
	 * `CustomFileManager.svelte`'s `api.intercept('create-file', ...)`),
	 * as well as internally by the normal 'create-file' event handler.
	 *
	 * Returns `null` on any failure (network error or non-ok response)
	 * instead of throwing, so callers can simply check truthiness.
	 */
	async createFile(file: IFile, parent: TID): Promise<ISingleResult | null> {
		if (file.file) {
			const multipartFormData: FormData = new FormData()
			multipartFormData.append('file', file.file)
			multipartFormData.append('name', file.name)

			const res: ISingleResult = await this.send<ISingleResult>(
				`upload?id=${encodeURIComponent(parent)}`,
				'POST',
				multipartFormData
			)
			return res && res.result ? res : null
		}

		const res: ISingleResult = await this.send<ISingleResult>(
			`files/${encodeURIComponent(parent)}`,
			'POST',
			this.getParams({
				name: `${file.name}`,
				type: file.type,
			})
		)
		return res && res.result ? res : null
	}

	async loadFiles(id: TID): Promise<IEntity[]> {
		const data = await this.send<IEntity[]>(
			id ? `files/${encodeURIComponent(id)}` : 'files',
			'GET'
		)
		return this.parseDates(data)
	}

	loadInfo(id: TID): Promise<void | IDrive[]> {
		return this.send<IDrive[]>(
			id ? `info/${encodeURIComponent(id)}` : 'info',
			'GET'
		)
	}

	parseDates(data: IEntity[]): IEntity[] {
		data.forEach(item => {
			if (item.date) item.date = new Date(item.date)
		})
		return data
	}

	async send<T>(
		url: string,
		method: string,
		data?: object | string,
		customHeaders?: Record<string, string>
	): Promise<T> {
		const headers: Record<string, string> = {
			...customHeaders,
		}

		const req: RequestInit = {
			method,
			headers,
		}

		if (data) {
			if (
				(typeof data === 'string' || typeof data === 'object') &&
				!(customHeaders && customHeaders['Content-Type'])
			) {
				headers['Content-Type'] = 'application/json'
			}
			req.body = data as BodyInit
		}
		const res: Response = await fetch(`${this._url}/${url}`, req)

		try {
			const response: T & { error?: string } = (await res.json()) as T & {
				error?: string
			}
			if (!res.ok) throw new Error(`Network error: ${response.error}`)
			return response
		} catch (error: unknown) {
			console.error(error)
			return undefined as unknown as T
		}
	}

	private getParams(obj: Record<string, unknown>): string {
		return JSON.stringify(obj)
	}

	private handleNonUniqueNames(serverIds: TID[], localIds: TID[]): void {
		localIds.forEach((id: TID, i: number) => {
			if (id !== serverIds[i])
				this.exec('file-renamed', {
					id,
					newId: serverIds[i],
				})
		})
	}
}
