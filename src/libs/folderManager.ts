'use strict';

import { Asset, AssetFile } from './asset';
import { FolderManagerUri } from './folderManagerUri';

export interface Directory {
	id: number;
	parentId: number | undefined;
	name: string;
}

export abstract class FolderManager {
	readonly mountFolderName: string;

	constructor() {
		this.mountFolderName = this.constructor.name;
	}

	/**
	 * Returns a list of subdirectories in the provided directory uri
	 * @param directoryUri 
	 */
	abstract getSubdirectories(directoryUri: FolderManagerUri): Promise<Array<string>>;

	/**
	 * Returns a list of assets in the provided directory uri
	 * @param directoryUri 
	 */
	abstract getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Array<Asset>>;

	/**
	 * Returns a list of files, extracted from an asset
	 * @param assetUri 
	 */
	abstract getAssetFiles(assetUri: FolderManagerUri): Promise<Array<AssetFile>>;

	/**
	 * Saves the content of the file back to the asset object
	 * @param asset 
	 * @param file 
	 */
	abstract setAssetFile(asset: Asset, file: AssetFile): Promise<void>;

	/**
	 * Returns an asset based on the provided uri
	 * @param assetUri - uri of an asset to return
	 * @param forceRefresh - if TRUE ignores cache and reloads an asset from the backend
	 */
	abstract getAsset(assetUri: FolderManagerUri, forceRefresh?: boolean): Promise<Asset>;

	/**
	 * Save asset back to the backend
	 * @param asset 
	 */
	abstract saveAsset(asset: Asset): Promise<void>;

	/**
	 * Each asset is represented as a folder. This function returns the name of the asset directory based on the original asset name.
	 * DIRECTORY NAMES SHOULD ALWAYS START WITH THE Ω SYMBOL FOLLOWED BY A SPACE. 
	 * This is required because VSCode sorts the content of
	 * each directory by name. Ω at the beginning allows us to push all assets to the end of the list after all folders. 
	 * Ω at the beginning of the asset folder name is also used to distinguish between regular folder and asset folders
	 * @param name - original name of the asset
	 * @param assetData - raw asset data
	 */
	getAssetDirectoryName(name: string, assetData: any): string {
		return `Ω 🟦  ${name}.${this.constructor.name.toLowerCase()}`;
	};

	/**
	 * Returns the original name of the asset based on asset directory name
	 * @param directoryName 
	 */
	getAssetNameByDirectoryName(directoryName: string): string | undefined {
		const match = directoryName.match(/^(?<prefix>([^\x00-\x7F]|\s)+)(?<name>.+)\.(?<suffix>[^\.]+)$/);
		return match?.groups?.name;
	}

	/**
	 * Returns a list of file extension added by the Manager. File extensions are used by the FolderController to distinguish between folders and files.
	 * Each element in the array should be lowercase and should start with the '.' symbol 
	 * Example: return ['.amp', '.sql', '.json']  
	 */
	getFileExtensions(): Array<string> {
		return [];
	}
}