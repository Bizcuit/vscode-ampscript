import * as vscode from 'vscode';
import * as path from 'path';
import { FolderController } from './folderController';

export class FolderManagerUri {
	public readonly connectionId: string;
	public readonly name: string;
	public readonly globalPath: string;
	public readonly mountPath: string;
	public readonly localPath: string;
	public readonly mountFolderName: string;
	public readonly type: vscode.FileType;
	public readonly isAsset: boolean;
	private readonly uri: vscode.Uri;

	constructor(uri: vscode.Uri) {
		this.uri = uri;
		this.connectionId = uri.authority;
		this.name = path.basename(uri.path);
		this.type = FolderController.getInstance().hasFileExtension(path.extname(this.name)) ? vscode.FileType.File : vscode.FileType.Directory;
		this.isAsset = this.name.startsWith('Ω');
		const basePath = `${uri.scheme}://${this.connectionId}/`;

		let chunks = uri.path.replace(/\\/g, '/').replace(/(^\/)|(\/$)/g, '').split('/');
		this.mountFolderName = chunks.shift() || '';
		this.localPath = chunks.join('/');
		this.mountPath = this.mountFolderName !== '' ? basePath + this.mountFolderName + '/' : '';
		this.globalPath = this.mountPath + this.localPath;
	}

	getChildPath(childDirectoryName: string) {
		return this.globalPath + (this.globalPath.endsWith('/') ? '' : '/') + childDirectoryName;
	}

	get parent(): FolderManagerUri | undefined {
		let chunks = this.localPath.split('/');

		if (chunks.length > 0) {
			chunks.pop();
			return new FolderManagerUri(vscode.Uri.parse(this.mountPath + chunks.join('/')));
		}

		return undefined;
	}
}
