import type { Component } from 'svelte'
import Folder from '@lucide/svelte/icons/folder'
import File from '@lucide/svelte/icons/file'
import FileQuestionMark from '@lucide/svelte/icons/file-question-mark'
import FileArchive from '@lucide/svelte/icons/file-archive'
import FileCode from '@lucide/svelte/icons/file-code'
import FileText from '@lucide/svelte/icons/file-text'
import FileAudio from '@lucide/svelte/icons/file-audio'
import FileVideo from '@lucide/svelte/icons/file-video'
import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet'
import FileImage from '@lucide/svelte/icons/file-image'
import Files from '@lucide/svelte/icons/files'
import Search from '@lucide/svelte/icons/search'
import type { LucideProps } from '@lucide/svelte/icons'
import type { IParsedEntity } from '@svar-ui/filemanager-store'
import whitelist from '../icons'

// maps a whitelisted type/extension to the lucide icon that represents it,
// mirroring the categories the old CDN-based icon service exposed
// (https://cdn.svar.dev/icons/filemanager/vivid/{size}/{icon}.svg)
const iconMap: Record<string, Component<LucideProps>> = {
	folder: Folder,
	file: File,
	multiple: Files,
	search: Search,
	// archives
	'7z': FileArchive,
	rar: FileArchive,
	zip: FileArchive,
	// code / markup
	css: FileCode,
	html: FileCode,
	js: FileCode,
	php: FileCode,
	xml: FileCode,
	sql: FileCode,
	// text / documents
	md: FileText,
	txt: FileText,
	doc: FileText,
	docx: FileText,
	pdf: FileText,
	// audio
	aif: FileAudio,
	mid: FileAudio,
	mp3: FileAudio,
	waw: FileAudio,
	wma: FileAudio,
	// video
	avi: FileVideo,
	mov: FileVideo,
	mp4: FileVideo,
	mpeg: FileVideo,
	mpg: FileVideo,
	// spreadsheets
	xls: FileSpreadsheet,
	xlsx: FileSpreadsheet,
	// images
	gif: FileImage,
	jpg: FileImage,
	jpeg: FileImage,
	png: FileImage,
	psd: FileImage,
	tiff: FileImage,
	svg: FileImage,
	// code
	py: FileCode,
}

export default function iconService(
	file: IParsedEntity
	// size: 'big' | 'small'
): Component<LucideProps> {
	const { type, ext } = file

	if (!type && !ext) return FileQuestionMark

	let icon: string = 'unknown'

	if (type && type !== 'file' && whitelist[type as keyof typeof whitelist]) {
		icon = type
	} else if (ext) {
		icon = whitelist[ext as keyof typeof whitelist] ? ext : 'file'
	}

	return iconMap[icon] ?? FileQuestionMark
}
