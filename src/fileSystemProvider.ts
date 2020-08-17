import * as path from 'path';
import * as vscode from 'vscode';
import { MCAPI, MCUri, MCAsset, MCAssetContent, MCAssetPart } from './marketingCloud';

export class MCFS implements vscode.FileSystemProvider {
	private mc: MCAPI;
	private rootDirectories: [string, vscode.FileType][] = [];
	private filesCache: Map<string, MCAssetContent> = new Map<string, MCAssetContent>();

	constructor(connections: Array<any>) {
		this.mc = new MCAPI();
		this.setConnections(connections);
	}

	setConnections(connections: Array<any>) {
		this.mc.setConnections(connections);
	}

	stat(uri: vscode.Uri): vscode.FileStat {
		let mcUri = new MCUri(uri.authority, uri.path);
		let type: vscode.FileType = this.getEntityType(mcUri);

		if (type == vscode.FileType.Unknown) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		return {
			type: type,
			mtime: Date.now(),
			size: 0,
			ctime: 0,
		};
	}

	async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		let assetPartFiles = this.readAssetAsDirectory(uri);

		if (assetPartFiles.length > 0) {
			return assetPartFiles;
		}

		let mcUri = new MCUri(uri.authority, uri.path);

		if (this.getEntityType(mcUri) != vscode.FileType.Directory) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}

		let result: [string, vscode.FileType][] = [];

		let directoryId = await this.mc.getDirectoryIdByPath(mcUri);

		let promises = await Promise.all([
			this.mc.getSubdirectoriesByDirectoryId(mcUri.mid, directoryId),
			this.mc.getAssetsByDirectoryId(mcUri.mid, directoryId)
		]);

		let subsfolders = promises[0] as Array<any>;
		let assets = promises[1] as Array<MCAssetContent>;

		subsfolders.forEach(subfolder => {
			result.push([subfolder.name as string, vscode.FileType.Directory]);
		});

		assets.forEach(asset => {
			let name = asset.name;
			let path = mcUri.globalPath + (mcUri.globalPath.endsWith("/") ? "" : "/") + name;

			this.filesCache.set(path, asset);

			if (asset.hasParts()) {
				result.push([name, vscode.FileType.Directory]);

				(asset as MCAsset).parts.forEach(part => {
					this.filesCache.set(path + '/' + part.name, part);
				});
			}
			else {
				result.push([name, vscode.FileType.File]);
			}
		});

		return result;
	}

	readAssetAsDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
		let result: [string, vscode.FileType][] = [];
		let mcUri = new MCUri(uri.authority, uri.path);
		let asset = this.filesCache.get(mcUri.globalPath);

		if (asset && asset.hasParts() && asset instanceof MCAsset) {
			(asset as MCAsset).parts.forEach(part => {
				result.push([part.name, vscode.FileType.File]);
			});
		}

		return result;
	}

	readFile(uri: vscode.Uri): Uint8Array {
		let mcUri = new MCUri(uri.authority, uri.path);

		if (this.getEntityType(mcUri) == vscode.FileType.File) {

			let file = this.filesCache.get(mcUri.globalPath);

			if (file) {
				return file.getData();
			}
		}

		throw vscode.FileSystemError.FileNotFound(uri);
	}

	findAssetToWrite(uri: MCUri): MCAsset {
		let file = this.filesCache.get(uri.globalPath);

		if (file instanceof MCAssetPart) {
			return this.findAssetToWrite(MCUri.getParent(uri));
		}

		if (file instanceof MCAsset) {
			return (file as MCAsset);
		}

		throw vscode.FileSystemError.FileNotFound(uri.globalPath);
	}

	async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<any> {
		let mcUri = new MCUri(uri.authority, uri.path);

		if (mcUri.name.indexOf('.readonly.') > 0) {
			throw vscode.FileSystemError.NoPermissions(uri);
		}

		let asset = this.findAssetToWrite(mcUri);
		let file = this.filesCache.get(mcUri.globalPath);

		file?.setData(content);

		let result = await this.mc.updateAsset(mcUri.mid, asset.getRawAsset());

		let savedAsset = await this.mc.getAssetById(mcUri.mid, asset.id);

		asset.parts.find(p => p.name == '__raw.readonly.json')?.setContent(
			savedAsset.parts.find(p => p.name == '__raw.readonly.json')?.getContent() || ''
		);

		this._fireSoon({ type: vscode.FileChangeType.Changed, uri });
	}






	/* NOT IMPLEMENTED */

	createDirectory(uri: vscode.Uri): void {
		throw new Error("CreateDirectory not implemented yet");

		let basename = path.posix.basename(uri.path);
		let dirname = uri.with({ path: path.posix.dirname(uri.path) });
		this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { type: vscode.FileChangeType.Created, uri });
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
		throw new Error("Rename not implemented yet");

		this._fireSoon(
			{ type: vscode.FileChangeType.Deleted, uri: oldUri },
			{ type: vscode.FileChangeType.Created, uri: newUri }
		);
	}

	delete(uri: vscode.Uri): void {
		throw new Error("Delete not implemented yet");

		let dirname = uri.with({ path: path.posix.dirname(uri.path) });
		let basename = path.posix.basename(uri.path);
		this._fireSoon({ type: vscode.FileChangeType.Changed, uri: dirname }, { uri, type: vscode.FileChangeType.Deleted });
	}


	// --- manage file events

	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timer;

	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

	watch(_resource: vscode.Uri): vscode.Disposable {
		// ignore, fires for all changes...
		return new vscode.Disposable(() => { });
	}

	private getEntityType(uri: MCUri) {
		if (uri.localPath.endsWith('.amp') || uri.localPath.endsWith('.ampscript')) {
			return vscode.FileType.File;
		}

		if (uri.localPath.endsWith('.json')) {
			return vscode.FileType.File;
		}

		if (uri.localPath == '/' || !uri.localPath.startsWith('/.')) {
			return vscode.FileType.Directory;
		}

		return vscode.FileType.Unknown;
	}

	private _fireSoon(...events: vscode.FileChangeEvent[]): void {
		this._bufferedEvents.push(...events);

		if (this._fireSoonHandle) {
			clearTimeout(this._fireSoonHandle);
		}

		this._fireSoonHandle = setTimeout(() => {
			this._emitter.fire(this._bufferedEvents);
			this._bufferedEvents.length = 0;
		}, 5);
	}
}
