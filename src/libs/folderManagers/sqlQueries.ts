import { Asset, AssetFile } from '../asset';
import { FolderManagerUri } from '../folderManagerUri';
import { FolderManager, Directory } from '../folderManager';
import { APIException, ConnectionController } from '../connectionController';
import { config } from 'process';
import { AxiosRequestConfig } from 'axios';


export class SqlQueriesFolderManager extends FolderManager {
	readonly mountFolderName: string = "SQL Queries";
	private directoriesCache: Map<string, Promise<Array<Directory>>>;
	private assetsCache: Map<string, Asset>;

	constructor() {
		super();
		this.directoriesCache = new Map<string, Promise<Array<Directory>>>();
		this.assetsCache = new Map<string, Asset>();
	}

	/* Interface implementation */

	async getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Asset[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		const config: AxiosRequestConfig = {
			method: 'get',
			url: `/automation/v1/queries/category/${directoryId}`,
			params: {
				'$page': 1,
				'$pageSize': 100,
				'retrievalType': 1
			}
		};

		const data: any = await ConnectionController.getInstance().restRequest(directoryUri.connectionId, config);

		let assets: Array<Asset> = new Array<Asset>();

		(data.items as Array<any>).forEach(a => {
			const asset: Asset = new Asset(
				a.name || '???',
				//AssetSubtype.SQL,
				this.getAssetDirectoryName(a.name, a),
				JSON.stringify(a, null, 2),
				directoryUri.connectionId,
				this.extractFiles(a)
			);
			//this.assetsCache.set(directoryUri.getChildPath(asset.fsName), asset);
			this.assetsCache.set(directoryUri.getChildPath(asset.directoryName), asset);
			assets.push(asset);
		});

		return assets;
	}

	async getSubdirectories(directoryUri: FolderManagerUri): Promise<string[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(directoryUri, directoryId);
		return subdirectories.map(d => d.name);
	}

	async saveAsset(asset: Asset): Promise<void> {
		const assetData: any = JSON.parse(asset.content);

		const config: AxiosRequestConfig = {
			method: 'patch',
			url: `/automation/v1/queries/${assetData.queryDefinitionId}`,
			data: assetData
		};

		const data: any = await ConnectionController.getInstance().restRequest(asset.connectionId, config);
	}

	async getAsset(assetUri: FolderManagerUri, forceRefresh = false): Promise<Asset> {
		const asset = this.assetsCache.get(assetUri.globalPath);

		if (asset !== undefined && !forceRefresh) {
			return asset;
		}

		throw new Error(`Asset ${assetUri.globalPath} not found`);
	}

	async setAssetFile(asset: Asset, file: AssetFile): Promise<void> {
		let assetData: any = JSON.parse(asset.content);
		assetData[file.path] = file.content;
		asset.content = JSON.stringify(assetData, null, 2);
	};

	getAssetDirectoryName(name: string, assetData: any): string {
		return `Ω 🟥  ${name}.query`;
	}

	getFileExtensions(): Array<string> {
		return ['.sql', '.json'];
	}

	/* Support methods */

	private extractFiles(assetData: any): Array<AssetFile> {
		let result: Array<AssetFile> = [];

		if (assetData?.queryText !== undefined) {
			result.push(new AssetFile(
				"query.sql",
				assetData?.queryText,
				"queryText"
			));
		}

		return result;
	}

	private async getAllDirectories(connectionId: string): Promise<Array<Directory>> {
		const cached = this.directoriesCache.get(connectionId);

		if (cached !== undefined) {
			return cached;
		}

		const config: AxiosRequestConfig = {
			method: 'get',
			url: '/automation/v1/folders/',
			params: {
				'$pagesize': '200',
				'$filter': `categorytype eq queryactivity`
			}
		};

		const pDirectories = ConnectionController.getInstance()
			.restRequest(connectionId, config)
			.then(response => {
				let directories = new Array<Directory>();

				response?.items?.forEach((e: any) => {
					directories.push({
						id: e.categoryId,
						parentId: e.parentId,
						name: e.name
					} as Directory);
				});

				return directories;
			});

		this.directoriesCache.set(connectionId, pDirectories);

		return pDirectories;
	}

	private async getSubdirectoriesByDirectoryId(uri: FolderManagerUri, directoryId: number): Promise<Array<Directory>> {
		const allDirectories = await this.getAllDirectories(uri.connectionId);

		return allDirectories.filter(d => d.parentId === directoryId);
	}

	private async getDirectoryId(uri: FolderManagerUri): Promise<number> {
		const allDirectories = await this.getAllDirectories(uri.connectionId);

		if (uri.localPath === '') {
			const root: Directory | undefined = allDirectories.find(d => d.parentId === 0);
			if (root !== undefined) {
				return root.id;
			}
		}

		if (uri.parent !== undefined) {
			const parentDirectoryId = await this.getDirectoryId(uri.parent);
			const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(uri, parentDirectoryId);

			for (let d of subdirectories) {
				if (d.name === uri.name) {
					return d.id;
				}
			}
		}

		throw new Error(`Path not found: ${uri.globalPath}`);
	}
}