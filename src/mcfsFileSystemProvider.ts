import * as vscode from 'vscode';
import { FolderController } from './libs/folderController';
import { FolderManagerUri } from './libs/folderManagerUri';
import { Utils } from './libs/utils';

export class MCFS implements vscode.FileSystemProvider {
	stat(uri: vscode.Uri): vscode.FileStat {
		const fmUri = new FolderManagerUri(uri);

		if (!FolderController.getInstance().hasManager(fmUri)) {
			throw vscode.FileSystemError.FileNotFound();
		}

		return {
			type: fmUri.type,
			mtime: Date.now(),
			size: 0,
			ctime: 0,
		};
	}

	async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
		const fmUri = new FolderManagerUri(uri);

		if (!FolderController.getInstance().hasManager(fmUri)) {
			throw vscode.FileSystemError.FileNotFound();
		}

		const pSubdirectories = FolderController.getInstance().getSubdirectories(fmUri);
		const pAssets = FolderController.getInstance().getAssets(fmUri);
		const pFiles = FolderController.getInstance().getFiles(fmUri);

		try {
			const [subdirectories, assets, files] = await Promise.all([pSubdirectories, pAssets, pFiles]);

			return [
				...subdirectories.map<[string, vscode.FileType]>(d => [d, vscode.FileType.Directory]),
				...assets.map<[string, vscode.FileType]>(a => [a.directoryName, vscode.FileType.Directory]),
				...files.map<[string, vscode.FileType]>(f => [f.name, vscode.FileType.File])
			];
		}
		catch (err) {
			Utils.getInstance().showErrorMessage(err);
			throw err;
		}

	}

	async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		const fmUri = new FolderManagerUri(uri);

		if (!FolderController.getInstance().hasManager(fmUri)) {
			throw vscode.FileSystemError.FileNotFound();
		}

		try {
			return FolderController.getInstance().readFile(fmUri);
		}
		catch (err) {
			Utils.getInstance().showErrorMessage(err);
			throw err;
		}
	}

	async writeFile(uri: vscode.Uri, content: Uint8Array, options: { create: boolean, overwrite: boolean }): Promise<any> {
		const fmUri = new FolderManagerUri(uri);

		if (!FolderController.getInstance().hasManager(fmUri)) {
			throw vscode.FileSystemError.FileNotFound();
		}

		try {
			return FolderController.getInstance().writeFile(fmUri, content);
		}
		catch (err) {
			Utils.getInstance().logError(err);
			throw new Error(Utils.getInstance().getErrorMessage(err));
		}

	}

	/* NOT IMPLEMENTED */

	createDirectory(uri: vscode.Uri): void {
		throw new Error("CreateDirectory not implemented yet");
	}

	rename(oldUri: vscode.Uri, newUri: vscode.Uri, options: { overwrite: boolean }): void {
		throw new Error("Rename not implemented yet");
	}

	delete(uri: vscode.Uri): void {
		throw new Error("Delete not implemented yet");
	}

	private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	private _bufferedEvents: vscode.FileChangeEvent[] = [];
	private _fireSoonHandle?: NodeJS.Timer;

	readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

	watch(_resource: vscode.Uri): vscode.Disposable {
		// ignore, fires for all changes...
		return new vscode.Disposable(() => { });
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
