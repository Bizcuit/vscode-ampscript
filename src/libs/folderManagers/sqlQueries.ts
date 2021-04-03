import { Asset, AssetFile } from '../asset';
import { FolderManagerUri } from '../folderManagerUri';
import { FolderManager, Directory, CustomAction } from '../folderManager';
import { ConnectionController } from '../connectionController';
import { AxiosRequestConfig } from 'axios';
import { Utils } from '../utils';


export class SqlQueriesFolderManager extends FolderManager {
	readonly mountFolderName: string = "SQL Queries";
	private directoriesCache: Map<string, Promise<Array<Directory>>>;

	constructor() {
		super();
		this.directoriesCache = new Map<string, Promise<Array<Directory>>>();

		this.customActions.push({
			command: "mcfs.query.run",
			waitLabel: "Running a Query",
			callback: (fmUri: FolderManagerUri, content: string): Promise<string | undefined> => this.customActionRunQuery(fmUri, content)
		} as CustomAction);
	}

	/* Interface implementation */

	async getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Asset[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		const hasTokenScopes = await ConnectionController.getInstance().hasTokenRequiredScopes(
			directoryUri.connectionId,
			['automations_execute', 'automations_read', 'automations_write']
		);

		if (!hasTokenScopes) {
			Utils.getInstance().sendTelemetryEvent("manager-sqlqueries.missing_api_scope", true, true);
			throw new Error('Additional permissions are required for this function: AUTOMATION: Automations (Read, Write, Execute). Please update your installed package and restart VSCode');
		}

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

		const assets: Array<Asset> = new Array<Asset>();

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

		await ConnectionController.getInstance().restRequest(asset.connectionId, config);
	}

	async setAssetFile(asset: Asset, file: AssetFile): Promise<void> {
		const assetData: any = JSON.parse(asset.content);
		assetData[file.path] = file.content;
		asset.content = JSON.stringify(assetData, null, 2);
	}

	getAssetDirectoryName(name: string, assetData: any): string {
		return `Ω 🟥  ${name}.query`;
	}

	getFileExtensions(): Array<string> {
		return ['.sql', '.json'];
	}

	/* Support methods */

	public async customActionRunQuery(fmUri: FolderManagerUri, content: string): Promise<string | undefined> {
		const assetUri = fmUri.isAsset ? fmUri : fmUri.parent;

		if (assetUri === undefined) return;

		const asset = await this.getAsset(assetUri, false);
		const assetMetadata: any = JSON.parse(asset.content);
		const queryId = assetMetadata?.["queryDefinitionId"];

		if (!queryId) return;

		await this.runQuery(queryId, fmUri.connectionId);

		const retriesDelay = 6000;
		const maxNumberOfRetries = 20;
		let currentRetry = 0;
		let hasFinished = false;

		while (maxNumberOfRetries > currentRetry++) {
			await Utils.getInstance().delay(retriesDelay);
			const isRunning = await this.isQueryRunning(queryId, fmUri.connectionId);

			if (!isRunning) {
				hasFinished = true;
				break;
			}
		}

		if (hasFinished) {
			Utils.getInstance().showInformationMessage("Query executed successfully");
		}
		else {
			Utils.getInstance().showErrorMessage("Query wait timeout");
		}

		return;
	}



	private async runQuery(queryId: string, connectionId: string): Promise<void> {
		const config: AxiosRequestConfig = {
			method: 'post',
			url: `automation/v1/queries/${queryId}/actions/start`
		};

		await ConnectionController.getInstance().restRequest(connectionId, config);
		return;
	}

	private async isQueryRunning(queryId: string, connectionId: string): Promise<boolean> {
		const config: AxiosRequestConfig = {
			method: 'get',
			url: `automation/v1/queries/${queryId}/actions/isrunning`
		};

		const data: any = await ConnectionController.getInstance().restRequest(connectionId, config);

		Utils.getInstance().log(JSON.stringify(data));

		return data.isRunning;
	}

	private extractFiles(assetData: any): Array<AssetFile> {
		const result: Array<AssetFile> = [];

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
				const directories = new Array<Directory>();

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

			for (const d of subdirectories) {
				if (d.name === uri.name) {
					return d.id;
				}
			}
		}

		throw new Error(`Path not found: ${uri.globalPath}`);
	}
}
