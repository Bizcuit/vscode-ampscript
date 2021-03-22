'use strict';

export type LazyContentDelegate = (() => Promise<string>) | undefined;

export class AssetFile {
	name: string;
	content: string;
	path: string;
	private getLazyContent: LazyContentDelegate;

	constructor(name: string, content: string, path: string, getLazyContent: LazyContentDelegate = undefined) {
		this.name = name;
		this.content = content;
		this.path = path;
		this.getLazyContent = getLazyContent;
	}

	write(data: Uint8Array): void {
		this.content = new TextDecoder("utf-8").decode(data);
	}

	async read(): Promise<Uint8Array> {
		if (this.content === '' && this.getLazyContent !== undefined) {
			this.content = await this.getLazyContent();
		}

		return new TextEncoder().encode(this.content);
	}
}

export class Asset {
	name: string;
	directoryName: string;
	content: string;
	readonly connectionId: string;
	private _files: Array<AssetFile>;

	constructor(name: string, directoryName: string, content: string, connectionId: string, files: Array<AssetFile> | undefined) {
		this.name = name;
		this.directoryName = directoryName;
		this.content = content;
		this.connectionId = connectionId;
		this._files = new Array<AssetFile>();

		if (files !== undefined) {
			this._files.push(...files);
		}
	}

	get files(): Array<AssetFile> {
		return [
			new AssetFile('__raw.readonly.json', this.content, ''),
			...this._files
		];
	}

	getFile(name: string): AssetFile {
		const f = this.files.find(f => f.name == name);

		if (f !== undefined) return f;

		throw new Error(`File ${name} not found`);
	}
}