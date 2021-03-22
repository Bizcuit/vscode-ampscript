'use strict';

import { CustomAction, FolderManager } from './folderManager';
import { FolderManagerUri } from './folderManagerUri';
import { Asset, AssetFile } from './asset';
import { ContentBuilderFolderManager, AssetSubtype } from './folderManagers/contentBuilder';
import { SqlQueriesFolderManager } from './folderManagers/sqlQueries';
import { DataextensionFolderManager } from './folderManagers/dataextensions';

export class FolderController {
	private static instance: FolderController | null = null;
	private managers: Map<string, FolderManager>;
	private fileExensions: Set<string>;
	public customActions: Array<CustomAction> = []; 

	constructor() {
		this.managers = new Map<string, FolderManager>();
		this.fileExensions = new Set<string>();

		this.addManager(new ContentBuilderFolderManager("Content Builder", [
			AssetSubtype.TEMPLATE,
			AssetSubtype.EMAIL_HTML,
			AssetSubtype.EMAIL_TEMPLATEBASED,
			AssetSubtype.EMAIL_TEXT,
			AssetSubtype.BLOCK_CODESNIPPET,
			AssetSubtype.BLOCK_FREEFORM,
			AssetSubtype.BLOCK_TEXT,
			AssetSubtype.BLOCK_HTML,
			AssetSubtype.JSON_MESSAGE
		], false));
		this.addManager(new ContentBuilderFolderManager("Cloud Pages", [AssetSubtype.WEBPAGE], true));
		this.addManager(new SqlQueriesFolderManager());
		this.addManager(new DataextensionFolderManager("Dataextensions", false));
	}

	static getInstance(): FolderController {
		if (FolderController.instance === null) {
			FolderController.instance = new FolderController();
		}

		return FolderController.instance;
	}

	private get rootFolders(): Array<string> {
		return Array.from<string>(this.managers.keys());
	}

	addManager(manager: FolderManager): void {
		this.managers.set(manager.mountFolderName, manager);

		manager.getFileExtensions().forEach(ext => {
			this.fileExensions.add(ext.toLowerCase());
		});

		this.customActions.push(...manager.customActions);
	}

	hasManager(uri: FolderManagerUri): boolean {
		return uri.mountPath === '' || this.managers.get(uri.mountFolderName) !== undefined;
	}

	hasFileExtension(extension: string): boolean {
		return this.fileExensions.has(extension.toLowerCase());
	}


	async getSubdirectories(uri: FolderManagerUri): Promise<Array<string>> {
		if (uri.mountPath === '') {
			return this.rootFolders;
		}

		if (uri.isAsset) {
			return [];
		}

		const manager = this.managers.get(uri.mountFolderName);

		return manager === undefined ? [] : manager.getSubdirectories(uri);
	}

	async getAssets(uri: FolderManagerUri): Promise<Array<Asset>> {
		if (uri.isAsset) {
			return [];
		}

		const manager = this.managers.get(uri.mountFolderName);

		return manager === undefined ? [] : manager.getAssetsInDirectory(uri);
	}

	async getFiles(uri: FolderManagerUri): Promise<Array<AssetFile>> {
		if (!uri.isAsset) return [];

		const manager = this.managers.get(uri.mountFolderName);

		return manager === undefined ? [] : manager.getAssetFiles(uri);
	}

	async readFile(fileUri: FolderManagerUri): Promise<Uint8Array> {
		const assetUri = fileUri.parent;
		const manager = this.managers.get(fileUri.mountFolderName);

		if (assetUri == undefined || !assetUri.isAsset || manager == undefined) {
			throw new Error(`Can't read file ${fileUri.globalPath}`);
		}

		const asset = await manager.getAsset(assetUri);
		const file = asset.getFile(fileUri.name);

		return file.read();
	}

	async writeFile(uri: FolderManagerUri, data: Uint8Array): Promise<void> {
		const parent = uri.parent;
		const manager = this.managers.get(uri.mountFolderName);

		if (parent == undefined || !parent.isAsset || manager == undefined) {
			throw new Error(`Can't read file ${uri.name}`);
		}

		if (uri.name.includes('.readonly.')) {
			throw new Error(`You can't change a readonly file ${uri.name}`);
		}

		const asset = await manager.getAsset(parent);
		const file = asset.getFile(uri.name);

		file.write(data);

		await manager.setAssetFile(asset, file);
		await manager.saveAsset(asset);
	}
}