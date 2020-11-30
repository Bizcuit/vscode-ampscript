
import { Asset, AssetFile, LazyContentDelegate } from '../asset';
import { ConnectionController, SoapOperation, SoapRequestConfig } from '../connectionController';
import { FolderManager, Directory } from '../folderManager';
import { FolderManagerUri } from '../folderManagerUri';
import { Utils } from '../utils';
import * as Papa from 'papaparse';

interface DataextensionColumn {
	Name: string;
	FieldType: string;
	ObjectID: string;
	MaxLength: string | undefined;
	Scale: string | undefined;
	IsRequired: string;
	IsPrimaryKey: string;
	DefaultValue: string | undefined;
	Ordinal: string;
}

export class DataextensionFolderManager extends FolderManager {
	readonly mountFolderName: string;
	readonly ignoreDirectories: boolean;
	private directoriesCache: Map<string, number>;
	private assetsCache: Map<string, Asset>;

	constructor(mountFolderName: string, ignoreDirectories: boolean) {
		super();
		this.mountFolderName = mountFolderName;
		this.ignoreDirectories = ignoreDirectories;
		this.directoriesCache = new Map<string, number>();
		this.assetsCache = new Map<string, Asset>();
	}

	/* Interface implementation */

	getAssetDirectoryName(name: string, assetData: any): string {
		return `Ω 🟦  ${name}.dataext`;
	}

	getFileExtensions(): Array<string> {
		return ['.csv'];
	}

	async getSubdirectories(directoryUri: FolderManagerUri): Promise<string[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		if (this.ignoreDirectories && directoryId != 0) return [];

		const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(directoryUri, directoryId);

		return subdirectories.map(d => d.name);
	}

	async getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Asset[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		let assets = await ConnectionController.getInstance().soapRequest(directoryUri.connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: {
				RetrieveRequestMsg: {
					$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
					RetrieveRequest: {
						ObjectType: "DataExtension",
						Properties: ["Name", "CustomerKey"],
						Filter: {
							$: { "xsi:type": "SimpleFilterPart" },
							Property: "CategoryID",
							SimpleOperator: "equals",
							Value: directoryId
						}
					}
				}
			},
			transformResponse: (body) => {
				return Utils.getInstance().getPropertyFromSoapJSON(body, "RetrieveResponseMsg.Results")?.map((e: any) => {
					const name: string = Utils.getInstance().getPropertyFromSoapJSON(e, "Name");
					const customerKey: string = Utils.getInstance().getPropertyFromSoapJSON(e, "CustomerKey");

					const asset: Asset = new Asset(
						name,
						this.getAssetDirectoryName(name, ''),
						JSON.stringify(e, null, 2),
						directoryUri.connectionId,
						[
							new AssetFile("rows.readonly.csv", "", "", async () => {
								const rows = await this.getDataextensionRows(directoryUri.connectionId, customerKey);
								return Papa.unparse(rows);
							}),
							new AssetFile("rows.readonly.json", "", "", async () => {
								const rows = await this.getDataextensionRows(directoryUri.connectionId, customerKey);
								return JSON.stringify(rows, null, 2);
							}),
							new AssetFile("columns.readonly.json", "", "", async () => {
								const columns = await this.getDataextensionColumns(directoryUri.connectionId, customerKey);
								return JSON.stringify(columns, null, 2);
							})
						]
					);
					return asset;
				});
			}
		} as SoapRequestConfig);

		if (assets === undefined) return [];

		for (let asset of assets) {
			this.assetsCache.set(directoryUri.getChildPath(asset.directoryName), asset);
		}

		return assets;
	}

	async getAsset(assetUri: FolderManagerUri, forceRefresh?: boolean): Promise<Asset> {
		const asset = this.assetsCache.get(assetUri.globalPath);

		if (asset !== undefined && !forceRefresh) {
			return asset;
		}

		throw new Error(`Asset ${assetUri.globalPath} not found`);
	}

	async setAssetFile(asset: Asset, file: AssetFile): Promise<void> {
		throw new Error('Method not implemented.');
	}

	async saveAsset(asset: Asset): Promise<void> {
		throw new Error('Method not implemented.');
	}


	/* Support methods */

	private async getDataextensionRows(connectionId: string, customerKey: string): Promise<Array<any>> {
		const columns = await this.getDataextensionColumns(connectionId, customerKey);
		const columnNames: Array<string> = columns.map(c => c.Name.trim());
		columnNames.unshift("_CustomObjectKey");

		const rows = await ConnectionController.getInstance().soapRequest(connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: {
				RetrieveRequestMsg: {
					$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
					RetrieveRequest: {
						ObjectType: `DataExtensionObject[${customerKey}]`,
						Properties: columnNames
					}
				}
			},
			transformResponse: (body) => {
				return Utils.getInstance().getPropertyFromSoapJSON(body, "RetrieveResponseMsg.Results")?.map((e: any) => {
					let row: any = {};

					Utils.getInstance().getPropertyFromSoapJSON(e, "Properties.Property")?.forEach((c: any) => {
						row[Utils.getInstance().getPropertyFromSoapJSON(c, "Name")] = Utils.getInstance().getPropertyFromSoapJSON(c, "Value");
					});

					return row;
				});
			}
		} as SoapRequestConfig);

		return rows;
	}

	private async getDataextensionColumns(connectionId: string, customerKey: string): Promise<Array<DataextensionColumn>> {
		const columns = await ConnectionController.getInstance().soapRequest(connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: {
				RetrieveRequestMsg: {
					$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
					RetrieveRequest: {
						ObjectType: "DataExtensionField",
						Properties: [
							"Name",
							"FieldType",
							"ObjectID",
							"MaxLength",
							"Scale",
							"IsRequired",
							"IsPrimaryKey",
							"DefaultValue",
							"Ordinal"
						],
						Filter: {
							$: { "xsi:type": "SimpleFilterPart" },
							Property: "DataExtension.CustomerKey",
							SimpleOperator: "equals",
							Value: customerKey
						}
					}
				}
			},
			transformResponse: (body) => {
				return Utils.getInstance().getPropertyFromSoapJSON(body, "RetrieveResponseMsg.Results")?.map((e: any) => {
					return {
						Name: Utils.getInstance().getPropertyFromSoapJSON(e, "Name"),
						FieldType: Utils.getInstance().getPropertyFromSoapJSON(e, "FieldType"),
						ObjectID: Utils.getInstance().getPropertyFromSoapJSON(e, "ObjectID"),
						MaxLength: Utils.getInstance().getPropertyFromSoapJSON(e, "MaxLength"),
						Scale: Utils.getInstance().getPropertyFromSoapJSON(e, "Scale"),
						IsRequired: Utils.getInstance().getPropertyFromSoapJSON(e, "IsRequired"),
						IsPrimaryKey: Utils.getInstance().getPropertyFromSoapJSON(e, "IsPrimaryKey"),
						DefaultValue: Utils.getInstance().getPropertyFromSoapJSON(e, "DefaultValue"),
						Ordinal: Utils.getInstance().getPropertyFromSoapJSON(e, "Ordinal")
					} as DataextensionColumn;
				});
			}
		} as SoapRequestConfig);

		return columns;
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
		let data = await ConnectionController.getInstance().soapRequest(uri.connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: {
				RetrieveRequestMsg: {
					$: { "xmlns": "http://exacttarget.com/wsdl/partnerAPI" },
					RetrieveRequest: {
						ObjectType: "DataFolder",
						Properties: ["ID", "Name", "ParentFolder.ID"],
						Filter: {
							$: { "xsi:type": "ComplexFilterPart" },
							LeftOperand: {
								$: { "xsi:type": "SimpleFilterPart" },
								Property: "ParentFolder.ID",
								SimpleOperator: "equals",
								Value: directoryId
							},
							LogicalOperator: "AND",
							RightOperand: {
								$: { "xsi:type": "SimpleFilterPart" },
								Property: "ContentType",
								SimpleOperator: "equals",
								Value: "dataextension"
							}
						}
					}
				}
			},
			transformResponse: (body) => {
				return Utils.getInstance().getPropertyFromSoapJSON(body, "RetrieveResponseMsg.Results")?.map((e: any) => {
					return {
						id: Utils.getInstance().getPropertyFromSoapJSON(e, "ID"),
						parentId: Utils.getInstance().getPropertyFromSoapJSON(e, "ParentFolder.ID"),
						name: Utils.getInstance().getPropertyFromSoapJSON(e, "Name")
					} as Directory
				});
			}
		} as SoapRequestConfig);

		if (data === undefined) return [];

		if (directoryId !== 0) {
			for (let d of data as Array<Directory>) {
				this.directoriesCache.set(uri.getChildPath(d.name), d.id);
			}
		}

		return data as Array<Directory>;
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
