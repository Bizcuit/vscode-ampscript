import { AxiosRequestConfig } from 'axios';
import { Asset, AssetFile } from '../asset';
import { ConnectionManager } from '../connectionManager';
import { FolderManager, Directory } from '../folderManager';
import { FolderManagerUri } from '../folderManagerUri';

export enum AssetType {
	UNKNOWN = 0,
	BLOCK = 1,
	TEMPLATE = 2,
	EMAIL = 3,
	WEBPAGE = 4,
	JSON_MESSAGE = 5
}

export enum AssetSubtype {
	UNKNOWN = 0,
	TEMPLATE = 4,
	EMAIL_HTML = 208,
	EMAIL_TEMPLATEBASED = 207,
	EMAIL_TEXT = 209,
	BLOCK_CODESNIPPET = 220,
	BLOCK_FREEFORM = 195,
	BLOCK_TEXT = 196,
	BLOCK_HTML = 197,
	WEBPAGE = 205,
	JSON_MESSAGE = 230
}


export class ContentBuilderFolderManager extends FolderManager {
	readonly mountFolderName: string;

	private directoriesCache: Map<string, number>;
	private assetsCache: Map<string, Asset>;
	private readonly assetSubtypesFilter: Array<AssetSubtype>;
	private readonly readOnlyRootFolder: boolean;

	constructor(mountFolderName: string, assetSubtypesFilter: Array<AssetSubtype>, readOnlyRootFolder: boolean) {
		super();
		this.directoriesCache = new Map<string, number>();
		this.assetsCache = new Map<string, Asset>();
		this.mountFolderName = mountFolderName;
		this.assetSubtypesFilter = assetSubtypesFilter;
		this.readOnlyRootFolder = readOnlyRootFolder;
	}

	/* Interface implementation */
	async getSubdirectories(directoryUri: FolderManagerUri): Promise<string[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		if (this.readOnlyRootFolder && directoryId != 0) return [];

		const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(directoryUri, directoryId);

		return subdirectories.map(d => d.name);
	}

	async getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Asset[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);
		return this.getAssetsByDirectoryId(directoryUri, directoryId);
	}

	async getAssetFiles(assetUri: FolderManagerUri): Promise<Array<AssetFile>> {
		const asset = this.assetsCache.get(assetUri.globalPath);
		return asset?.files || [];
	}

	async saveAsset(asset: Asset): Promise<void> {
		const assetData: any = JSON.parse(asset.content);

		const config: AxiosRequestConfig = {
			method: 'patch',
			url: `/asset/v1/content/assets/${assetData.id}`,
			data: assetData
		};

		const data: any = await ConnectionManager.getInstance().restRequest(asset.connectionId, config);
		console.log('Asset updated', data);
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

		if (file.path === '') {
			asset.content = file.content;
		}
		else {
			let path = file.path.split('/');
			let ref: any = assetData;

			for (let i = 0; i < path.length - 1; i++) {
				ref = ref?.[path[i]];
			}

			const prop: string = path.pop() || '';

			if (typeof ref[prop] === "object") {
				ref[prop] = JSON.parse(file.content);
			}
			else {
				ref[prop] = file.content;
			}

			asset.content = JSON.stringify(assetData, null, 2);
		}
	}

	getAssetDirectoryName(name: string, assetData: any): string {
		const subtype: AssetSubtype = assetData?.assetType?.id as AssetSubtype || AssetSubtype.UNKNOWN;
		const type: AssetType = ContentBuilderFolderManager.getAssetTypeBySubtype(subtype);

		let suffix = '.unknown';
		let prefix = '⬛';

		switch (type) {
			case AssetType.BLOCK:
				prefix = '🟥';
				suffix = '.block';
				break;

			case AssetType.EMAIL:
				prefix = '🟦';
				suffix = '.email';
				break;

			case AssetType.TEMPLATE:
				prefix = '🟨';
				suffix = '.template';
				break;

			case AssetType.WEBPAGE:
				prefix = '🟩';
				suffix = '.cloudpage'
				break;

			case AssetType.JSON_MESSAGE:
				prefix = '🟪';
				suffix = '.jsonmessage'
				break;

			default:
				prefix = '⬛';
				suffix = '.unknown'
				break;
		}

		return `Ω ${prefix}  ${name}${suffix}`;
	}

	getFileExtensions(): Array<string> {
		return ['.amp', '.json'];
	}

	/* Support methods */

	private static getAssetTypeBySubtype(subtype: AssetSubtype): AssetType {
		switch (subtype) {
			case AssetSubtype.BLOCK_CODESNIPPET:
			case AssetSubtype.BLOCK_FREEFORM:
			case AssetSubtype.BLOCK_HTML:
			case AssetSubtype.BLOCK_TEXT:
				return AssetType.BLOCK;
			case AssetSubtype.EMAIL_HTML:
			case AssetSubtype.EMAIL_TEMPLATEBASED:
			case AssetSubtype.EMAIL_TEXT:
				return AssetType.EMAIL;
			case AssetSubtype.TEMPLATE:
				return AssetType.TEMPLATE;
			case AssetSubtype.WEBPAGE:
				return AssetType.WEBPAGE;
			case AssetSubtype.JSON_MESSAGE:
				return AssetType.JSON_MESSAGE;
		}
		return AssetType.UNKNOWN;
	}

	private async getAssetsByDirectoryId(uri: FolderManagerUri, directoryId: number): Promise<Array<Asset>> {
		const config: AxiosRequestConfig = {
			method: 'post',
			url: '/asset/v1/content/assets/query',
			data: {
				"page":
				{
					"page": 1,
					"pageSize": 100
				},
				"query":
				{
					"leftOperand":
					{
						"property": "category.id",
						"simpleOperator": "equal",
						"value": directoryId
					},
					"logicalOperator": "AND",
					"rightOperand":
					{
						"property": "assetType.id",
						"simpleOperator": "in",
						"value": this.assetSubtypesFilter
					}
				}
			}
		};

		const data: any = await ConnectionManager.getInstance().restRequest(uri.connectionId, config);

		let assets: Array<Asset> = new Array<Asset>();

		(data.items as Array<any>).forEach(a => {
			let asset = new Asset(
				a.name,
				this.getAssetDirectoryName(a.name, a),
				JSON.stringify(a, null, 2),
				uri.connectionId,
				this.extractFiles(a)
			);

			this.assetsCache.set(uri.getChildPath(asset.directoryName), asset)
			assets.push(asset);
		});

		return assets;
	}

	private extractFiles(assetData: any): Array<AssetFile> {
		let result: Array<AssetFile> = [];

		if (assetData?.views?.subjectline?.content !== undefined) {
			result.push(new AssetFile(
				"_subject.amp",
				assetData?.views?.subjectline?.content,
				"views/subjectline/content"
			));
		}

		if (assetData?.views?.preheader?.content !== undefined) {
			result.push(new AssetFile(
				"_preheader.amp",
				assetData?.views?.subjectline?.content,
				"views/preheader/content"
			));
		}

		if (assetData?.views?.html?.content !== undefined) {
			result.push(new AssetFile(
				'_htmlcontent.amp',
				assetData?.views?.html?.content || '',
				'views/html/content',
			));
		}

		/* Templates and emails */
		if (assetData?.content !== undefined) {
			result.push(new AssetFile(
				'_content.amp',
				assetData?.content || '',
				'content'
			));
		}

		/* JSON messages */
		if (assetData?.views !== undefined) {
			const views: any = assetData?.views;

			for (let viewName in views) {
				let data: any = assetData?.views[viewName]?.meta?.options?.customBlockData;
				if (data) {
					result.push(new AssetFile(
						viewName.toLowerCase() + '.json',
						JSON.stringify(data, null, 2),
						`views/${viewName}/meta/options/customBlockData`
					));
				}
			}
		}

		/* Emails and Cloud Pages */
		if (assetData?.views?.html?.slots !== undefined) {
			const slots: any = assetData?.views?.html?.slots;
			let slotIndex = 0;

			for (let s in slots) {
				let slot = slots[s];
				let blocks = slot.blocks || {};
				let blockIndex = 1;

				slotIndex++;

				for (let b in blocks) {
					let block = blocks[b];
					let path = `views/html/slots/${s}/blocks/${b}/`;
					let slotName = 's' + (slotIndex < 10 ? '0' : '') + slotIndex;
					let blockName = 'b' + (blockIndex < 10 ? '0' : '') + blockIndex;

					blockIndex++;

					result.push(new AssetFile(
						`${slotName}.${blockName}.content.amp`,
						block.content || "",
						path + "content",
					));

					result.push(new AssetFile(
						`${slotName}.${blockName}.super.amp`,
						block.superContent || "",
						path + "superContent"
					));
				}
			}

		}

		return result;
	}

	private async getDirectoryId(uri: FolderManagerUri): Promise<number> {
		if (this.directoriesCache.get(uri.globalPath) !== undefined) {
			return this.directoriesCache.get(uri.globalPath) || 0;
		}

		if (uri.localPath === '') {
			return this.getRootDirectoryId(uri);
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

	private async getSubdirectoriesByDirectoryId(uri: FolderManagerUri, directoryId: number): Promise<Array<Directory>> {
		const config: AxiosRequestConfig = {
			method: 'get',
			url: '/asset/v1/content/categories/',
			params: {
				'$pagesize': '100',
				'$filter': `parentId eq ${directoryId}`
			}
		};

		const data: any = await ConnectionManager.getInstance().restRequest(uri.connectionId, config);

		if (directoryId !== 0) {
			for (let d of data.items as Array<Directory>) {
				this.directoriesCache.set(uri.getChildPath(d.name), d.id);
			}
		}

		return data.items as Array<Directory>;
	}

	private async getRootDirectoryId(uri: FolderManagerUri): Promise<number> {
		if (this.directoriesCache.get(uri.mountPath) !== undefined) {
			return this.directoriesCache.get(uri.mountPath) || 0;
		}

		const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(uri, 0);

		this.directoriesCache.set(uri.globalPath, subdirectories[0].id);

		return subdirectories[0].id;
	}
}
