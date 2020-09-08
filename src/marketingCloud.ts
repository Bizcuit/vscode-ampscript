'use strict';

import axios, { AxiosRequestConfig } from 'axios';
import * as path from 'path';
import { isNullOrUndefined } from 'util';

export class MCUri {
	public readonly mid: string = "";
	public readonly name: string = "";
	public readonly globalPath: string = "";
	public readonly localPath: string = "";
	public readonly parts: Array<string> = [];

	constructor(mid: string, localPath: string) {
		this.mid = mid;
		this.name = path.basename(localPath);
		this.localPath = localPath.replace(/\\/gi, '/');
		this.globalPath = path.join('/', this.mid, this.localPath).replace(/\\/gi, '/');
	}

	public static getParent(uri: MCUri): MCUri {
		let parts: Array<string> = uri.localPath.split('/');
		parts.pop();
		return new MCUri(uri.mid, parts.join('/') || '/');
	}
}

export enum MCAssetType {
	UNKNOWN = 0,
	BLOCK = 1,
	TEMPLATE = 2,
	EMAIL = 3,
	WEBPAGE = 4,
	JSON_MESSAGE = 5
}

export enum MCAssetSubtype {
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

export abstract class MCAssetContent {
	public id: string = "";
	public name: string = "";


	public abstract getContent(): string;
	public abstract setContent(content: string): void;
	public abstract hasParts(): boolean;

	public setData(data: Uint8Array): void {
		this.setContent(new TextDecoder("utf-8").decode(data));
	}

	public getData(): Uint8Array {
		return new TextEncoder().encode(this.getContent());
	}
}

export class MCAssetPart extends MCAssetContent {
	public readonly path: string = "";

	private content: string = "";

	private isChanged: boolean = false;

	public isJsonContent: boolean = false;

	constructor(id: string, name: string, path: string, content: string, isJsonContent: boolean = false) {
		super();

		this.id = id;
		this.name = name;
		this.content = content;
		this.path = path;
		this.isJsonContent = isJsonContent;
	}

	public hasParts(): boolean {
		return false;
	}

	public hasChanges(): boolean {
		return this.isChanged;
	}

	public getContent(): string {
		return this.content;
	}

	public setContent(content: string): void {
		this.content = content;
		this.isChanged = true;
	}

	public resetChanges(): void {
		this.isChanged = false;
	}
}

export class MCAsset extends MCAssetContent {
	public readonly subtype: MCAssetSubtype;
	public readonly type: MCAssetType;
	public readonly id: string;
	public readonly parts: Array<MCAssetPart>;

	private asset: any;

	constructor(asset: any) {
		super();

		this.id = asset.id;
		this.asset = asset;

		this.subtype = asset.assetType && (asset.assetType.id as MCAssetSubtype) || MCAssetSubtype.UNKNOWN;
		this.type = this.getAssetTypeBySubtype(this.subtype);
		this.parts = this.getAssetParts();

		this.name = this.getName();
	}

	getContent(): string {
		switch (this.type) {

			case MCAssetType.BLOCK:
			case MCAssetType.TEMPLATE:
				return this.asset.content;

			default:
				return JSON.stringify(this.asset, null, 2);
		}
	}

	setContent(content: string) {
		switch (this.type) {

			case MCAssetType.BLOCK:
			case MCAssetType.TEMPLATE:
				this.asset.content = content;
				break;

			default:
				this.asset = JSON.parse(content);
		}
	}

	public hasParts(): boolean {
		return this.parts.length > 0;
	}

	private getName(): string {
		let suffix = '.json';
		let prefix = '';

		switch (this.type) {
			case MCAssetType.BLOCK:
				prefix = '🟥';
				suffix = '.block';
				break;

			case MCAssetType.EMAIL:
				prefix = '🟦';
				suffix = '.email';
				break;

			case MCAssetType.TEMPLATE:
				prefix = '🟨';
				suffix = '.template';
				break;

			case MCAssetType.WEBPAGE:
				prefix = '🟩';
				suffix = '.cloudpage'
				break;

			case MCAssetType.JSON_MESSAGE:
				prefix = '🟪';
				suffix = '.jsonmessage'
				break;

			default:
				prefix = '⬛';
				suffix = '.unknown'
				break;
		}

		return `Ω  ${prefix}  ${this.asset.name}${suffix}`;
	}

	private getAssetTypeBySubtype(subtype: MCAssetSubtype): MCAssetType {
		switch (subtype) {
			case MCAssetSubtype.BLOCK_CODESNIPPET:
			case MCAssetSubtype.BLOCK_FREEFORM:
			case MCAssetSubtype.BLOCK_HTML:
			case MCAssetSubtype.BLOCK_TEXT:
				return MCAssetType.BLOCK;
			case MCAssetSubtype.EMAIL_HTML:
			case MCAssetSubtype.EMAIL_TEMPLATEBASED:
			case MCAssetSubtype.EMAIL_TEXT:
				return MCAssetType.EMAIL;
			case MCAssetSubtype.TEMPLATE:
				return MCAssetType.TEMPLATE;
			case MCAssetSubtype.WEBPAGE:
				return MCAssetType.WEBPAGE;
			case MCAssetSubtype.JSON_MESSAGE:
				return MCAssetType.JSON_MESSAGE;
		}

		return MCAssetType.UNKNOWN;


	}

	private getAssetParts(): Array<MCAssetPart> {

		switch (this.type) {
			case MCAssetType.EMAIL:
				return [
					...this.getAssetsPartsBasic(),
					...this.getAssetPartsExtraEmail(),
					...this.getAssetPartsFromSlots(this.asset?.views?.html?.slots)
				];

			case MCAssetType.WEBPAGE:
				return [
					...this.getAssetsPartsBasic(),
					...this.getAssetPartsFromSlots(this.asset?.views?.html?.slots)
				];

			case MCAssetType.BLOCK:
				return this.getAssetsPartsBasic();

			case MCAssetType.TEMPLATE:
				return this.getAssetsPartsBasic();

			case MCAssetType.JSON_MESSAGE:
				return [
					...this.getAssetsPartsBasic(),
					...this.getAssetPartsFromViews()
				];
			default:
				return this.getAssetsPartsBasic();
		}

		return [];
	}

	private getAssetPartsFromViews(): Array<MCAssetPart> {
		let result: Array<MCAssetPart> = [];

		let views: any = this.asset?.views;

		if (views) {
			for (let viewName in views) {
				let data: any = this.asset?.views[viewName]?.meta?.options?.customBlockData;
				if (data) {
					result.push(new MCAssetPart(
						this.id,
						viewName.toLowerCase() + '.json',
						`views/${viewName}/meta/options/customBlockData`,
						JSON.stringify(data, null, 2),
						true
					));
				}
			}
		}

		return result;
	}

	private getAssetPartsExtraEmail(): Array<MCAssetPart> {
		let result: Array<MCAssetPart> = [];

		if (this.asset?.views?.subjectline?.content !== undefined) {
			result.push(new MCAssetPart(
				this.id,
				'_subject.amp',
				'views/subjectline/content',
				this.asset?.views?.subjectline?.content
			));
		}

		if (this.asset?.views?.preheader?.content !== undefined) {
			result.push(new MCAssetPart(
				this.id,
				'_preheader.amp',
				'views/preheader/content',
				this.asset?.views?.preheader?.content
			));
		}

		return result;
	}

	private getAssetPartsFromSlots(slots: any): Array<MCAssetPart> {
		if (!slots) {
			return [];
		}

		let result: Array<MCAssetPart> = [];
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

				result.push(new MCAssetPart(
					this.id,
					`${slotName}.${blockName}.content.amp`,
					path + "content",
					block.content || ""
				));

				result.push(new MCAssetPart(
					this.id,
					`${slotName}.${blockName}.super.amp`,
					path + "superContent",
					block.superContent || ""
				));
			}
		}

		return result;
	}

	private getAssetsPartsBasic(): Array<MCAssetPart> {
		let result: Array<MCAssetPart> = [];

		result.push(new MCAssetPart(
			this.id,
			'__raw.readonly.json',
			'',
			JSON.stringify(this.asset, null, 2)
		));

		if (this.asset?.views?.html?.content !== undefined) {
			result.push(new MCAssetPart(
				this.id,
				'_htmlcontent.amp',
				'views/html/content',
				this.asset?.views?.html?.content || ''
			));
		}

		if (this.asset?.content !== undefined) {
			result.push(new MCAssetPart(
				this.id,
				'_content.amp',
				'content',
				this.asset?.content || ''
			));
		}

		return result;
	}

	public getRawAsset(): any {

		this.setAllAssetParts();

		let raw: any = {
			id: this.asset.id
		};

		if (this.asset.content) {
			raw['content'] = this.asset.content;
		}

		if (this.asset.views) {
			raw['views'] = this.asset.views;
		}

		return raw;
	}

	public setAllAssetParts(): void {
		this.parts.forEach(part => {
			if (part.hasChanges()) {
				this.setAssetPart(part);
			}
		});
	}

	public setAssetPart(part: MCAssetPart): void {

		if (part.path === '') {
			this.asset = JSON.parse(part.getContent());
			return;
		}

		let path = part.path.split('/');
		let ref: any = this.asset;

		for (let i = 0; i < path.length - 1; i++) {
			ref = ref?.[path[i]];
		}

		ref[path.pop() || ''] = part.isJsonContent ? JSON.parse(part.getContent()) : part.getContent();

		part.resetChanges();
	}
}

export class MCAPI {
	private connections: Map<string, any>;
	private tokens: Map<string, any>;
	private directoriesCache: Map<string, number>;

	constructor() {
		this.connections = new Map<string, any>();
		this.tokens = new Map<string, any>();
		this.directoriesCache = new Map<string, number>();
	}

	setConnections(connections: Array<any>) {
		connections.forEach(v => {

			if (!v.grant_type) {
				v.grant_type = "client_credentials";
			}

			this.connections.set(v.account_id, v);
		});
	}

	async getToken(mid: string): Promise<any> {

		if (isNullOrUndefined(mid.match(/^\d+$/g))) {
			throw new Error("Incorrect MID");
		}

		let now = new Date().getTime();
		let connection = this.connections.get(mid);
		let token = this.tokens.get(mid);

		if (isNullOrUndefined(connection)) {
			throw new Error("Connection config has not been set");
		}

		if (!isNullOrUndefined(token) && token.expiration > now) {
			return token;
		}


		return new Promise((resolve, reject) => {
			axios({
				method: 'post',
				url: connection.authBaseUri + 'v2/token',
				headers: { 'Content-Type': 'application/json' },
				data: connection
			})
				.then((response) => {
					token = response.data;
					token.expiration = now + (token.expires_in - 5) * 1000;
					this.tokens.set(mid, token);
					resolve(token);
				})
				.catch((error) => {
					reject('Unable to connect to MC. Check your connection config.');
				});
		});
	}

	async execRestApi(mid: string, config: AxiosRequestConfig): Promise<any> {
		let token = await this.getToken(mid);

		config.baseURL = token.rest_instance_url;

		config.headers = {
			'Content-Type': 'application/json',
			'Authorization': `${token.token_type} ${token.access_token}`
		};

		return new Promise((resolve, reject) => {
			axios(config)
				.then((response) => {
					resolve(response.data);
				})
				.catch((error) => {
					reject('MC API call failed. Check that your MC installed package has all required permissions.');
				});
		});
	}

	async getDirectoryIdByPath(uri: MCUri): Promise<number> {
		if (uri.localPath == '/') {
			return 0;
		}

		if (!isNullOrUndefined(this.directoriesCache.get(uri.globalPath))) {
			return this.directoriesCache.get(uri.globalPath) || 0;
		}

		let parent = MCUri.getParent(uri);
		let parentDirId = await this.getDirectoryIdByPath(parent);

		let parentSubdirectories = await this.getSubdirectoriesByDirectoryId(uri.mid, parentDirId);

		for (let i = 0; i < parentSubdirectories.length; i++) {
			if (uri.name == parentSubdirectories[i].name) {
				this.directoriesCache.set(uri.globalPath, parentSubdirectories[i].id);
				return parentSubdirectories[i].id;
			}
		}

		throw new Error(`Path not found: ${uri.globalPath}`);
	}

	async getSubdirectoriesByDirectoryId(mid: string, directoryId: number): Promise<Array<any>> {
		let config: AxiosRequestConfig = {
			method: 'get',
			url: 'asset/v1/content/categories/',
			params: {
				'$pagesize': '100',
				'$filter': `parentId eq ${directoryId}`
			}
		};

		let data: any = await this.execRestApi(mid, config);

		return data.items;
	}

	async getAssetsByDirectoryId(mid: string, directoryId: number): Promise<Array<MCAsset>> {

		if (directoryId == 0) return [];

		let config: AxiosRequestConfig = {
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
						"value": [
							MCAssetSubtype.TEMPLATE,

							MCAssetSubtype.EMAIL_HTML,
							MCAssetSubtype.EMAIL_TEMPLATEBASED,
							MCAssetSubtype.EMAIL_TEXT,

							MCAssetSubtype.BLOCK_CODESNIPPET,
							MCAssetSubtype.BLOCK_FREEFORM,
							MCAssetSubtype.BLOCK_TEXT,
							MCAssetSubtype.BLOCK_HTML,

							MCAssetSubtype.WEBPAGE,

							MCAssetSubtype.JSON_MESSAGE
						]
					}
				}
			}
		};

		let data: any = await this.execRestApi(mid, config);

		return (data.items as Array<any>).map(v => new MCAsset(v));
	}

	async updateAsset(mid: string, asset: any): Promise<any> {
		let config: AxiosRequestConfig = {
			method: 'patch',
			url: `/asset/v1/content/assets/${asset.id}`,
			data: asset
		};

		let data: any = await this.execRestApi(mid, config);

		return data;
	}

	async getAssetById(mid: string, assetId: string): Promise<MCAsset> {
		let config: AxiosRequestConfig = {
			method: 'get',
			url: `/asset/v1/content/assets/${assetId}`
		};

		let data: any = await this.execRestApi(mid, config);

		return new MCAsset(data);
	}
};