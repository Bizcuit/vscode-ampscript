
import { Asset, AssetFile } from '../asset';
import { ConnectionController, SoapOperation, SoapRequestConfig } from '../connectionController';
import { FolderManager, Directory, CustomAction } from '../folderManager';
import { FolderManagerUri } from '../folderManagerUri';
import { Utils } from '../utils';
import * as Papa from 'papaparse';
import { SoapFilterExpression, SoapUtils } from '../soapUtils';
import * as vscode from 'vscode';

interface DataextensionColumn {
	Name: string;
	FieldType: string;
	ObjectID: string;
	MaxLength: string | undefined;
	Scale: string | undefined;
	IsRequired: string;
	IsPrimaryKey: string;
	DefaultValue: string | undefined;
	Ordinal: number;
}

export class DataextensionFolderManager extends FolderManager {
	readonly mountFolderName: string;
	readonly ignoreDirectories: boolean;
    readonly rootFolderCustomerKey: string;
    readonly folderContentType: string;
	private directoriesCache: Map<string, number>;
	private filterString = "";


	constructor(
        mountFolderName: string, 
        ignoreDirectories: boolean, 
        rootFolderCustomerKey = "dataextension_default",
        folderContentType = "dataextension") 
    {
		super();

		this.mountFolderName = mountFolderName;
		this.ignoreDirectories = ignoreDirectories;
		this.rootFolderCustomerKey = rootFolderCustomerKey;
        this.folderContentType = folderContentType;
        this.directoriesCache = new Map<string, number>();

		this.customActions.push({
			command: "mcfs.dataextension.filter",
			waitLabel: "Filtering a Dataextension",
			callback: (fmUri: FolderManagerUri, content: string): Promise<string | undefined> => this.customActionFilter(fmUri, content)
		} as CustomAction);
	}

	/* Interface implementation */

	getAssetDirectoryName(name: string, assetData: any): string {
		return `Ω 🟦  ${name}.dataext`;
	}

	getFileExtensions(): Array<string> {
		return ['.csv', '.txt'];
	}

	async getSubdirectories(directoryUri: FolderManagerUri): Promise<string[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		if (this.ignoreDirectories && directoryId != 0) return [];

		const subdirectories: Array<Directory> = await this.getSubdirectoriesByDirectoryId(directoryUri, directoryId);

		return subdirectories.map(d => d.name);
	}

	async getAssetsInDirectory(directoryUri: FolderManagerUri): Promise<Asset[]> {
		const directoryId: number = await this.getDirectoryId(directoryUri);

		const assets = await ConnectionController.getInstance().soapRequest(directoryUri.connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: SoapUtils.createRetrieveBody(
				"DataExtension",
				["Name", "CustomerKey"],
				{
					Property: "CategoryID",
					SimpleOperator: "equals",
					Value: directoryId
				}
			),
			transformResponse: (body) => {
				return SoapUtils.getArrProp(body, "RetrieveResponseMsg.Results").map((e: any) => {
					const name: string = SoapUtils.getStrProp(e, "Name");
					const customerKey: string = SoapUtils.getStrProp(e, "CustomerKey");

					return new Asset(
						name,
						this.getAssetDirectoryName(name, ''),
						JSON.stringify(e, null, 2),
						directoryUri.connectionId,
						[
							new AssetFile("rows.csv", "", "", async () => {
								const rows = await this.getDataextensionRows(directoryUri.connectionId, customerKey);
								return rows !== undefined ? Papa.unparse(rows) : "";
							}),
							new AssetFile("rows.json", "", "", async () => {
								const rows = await this.getDataextensionRows(directoryUri.connectionId, customerKey);
								return JSON.stringify(rows, null, 2);
							}),
							new AssetFile("_columns.readonly.json", "", "", async () => {
								const columns = await this.getDataextensionColumns(directoryUri.connectionId, customerKey);
								return JSON.stringify(columns, null, 2);
							}),
							new AssetFile("_docs.readonly.txt", "", "", async () => {
								const columns = await this.getDataextensionColumns(directoryUri.connectionId, customerKey);
								return this.getDocumentationFileContent(name, columns);
							})
						]
					);
				});
			}
		} as SoapRequestConfig);

		if (assets === undefined) return [];

		for (const asset of assets) {
			this.assetsCache.set(directoryUri.getChildPath(asset.directoryName), asset);
		}

		return assets;
	}

	async setAssetFile(asset: Asset, file: AssetFile): Promise<void> {
		const data = JSON.parse(asset.content);
		const customerKey = data?.CustomerKey?.[0];

		if (file.name === "rows.csv") {
			const rows = Papa.parse(file.content, {
				header: true
			}).data;
			await this.upsertDataextensionRows(asset.connectionId, customerKey, rows);
		}

		else if (file.name === "rows.json") {
			const rows = JSON.parse(file.content);
			await this.upsertDataextensionRows(asset.connectionId, customerKey, rows);
		}

		return;
	}

	async saveAsset(asset: Asset): Promise<void> {
		return;
	}



	/* Support methods */

	private getDocumentationFileContent(name: string, columns: any) {
		let content = `Dataextension name: ${name}\r\n\r\n`;

		content += '| Name                 | Type            | Not NULL | PK       | Default Value   |\r\n';
		content += '| -------------------- | --------------- | -------- | -------- | --------------- |\r\n';

		columns.forEach((c: any) => {
			let type = c.FieldType;

			if (c.FieldType == 'Decimal' && c.MaxLength) {
				type += '(' + c.MaxLength + (c.Scale ? ',' + c.Scale : '') + ')';
			}

			if (c.FieldType == 'Text' && c.MaxLength) {
				type += '(' + c.MaxLength + ')';
			}

			content += '| ' + c.Name.padEnd(20, ' ')
				+ ' | ' + type.padEnd(15, ' ')
				+ ' | ' + c.IsRequired.padEnd(8, ' ')
				+ ' | ' + c.IsPrimaryKey.padEnd(8, ' ')
				+ ' | ' + c.DefaultValue.padEnd(15, ' ')
				+ ' |\r\n';
		})

		return content;
	}

	public async customActionFilter(fmUri: FolderManagerUri, content: string): Promise<string | undefined> {
		const assetUri = fmUri.isAsset ? fmUri : fmUri.parent;

		if (assetUri === undefined) {
			return "";
		}

		const filterString = await vscode.window.showInputBox({
			value: this.filterString,
			ignoreFocusOut: true,
			placeHolder: "Your filter query string. EG: OrderID = 'ORD2123F2' AND SubscriberKey = 'ABC'"
		});

		this.filterString = filterString || "";

		const filter = new SoapFilterExpression(filterString as string).filter;
		const asset = await this.getAsset(assetUri, false);
		const customerKey = SoapUtils.getStrProp(JSON.parse(asset.content), "CustomerKey");
		const rows = await this.getDataextensionRows(assetUri.connectionId, customerKey, filter);

		if (!rows?.length) {
			Utils.getInstance().showErrorMessage(new Error(`There are no data rows that match your filter: '${filterString}'. Non-filtered content will be shown`));
			return undefined;
		}

		Utils.getInstance().showInformationMessage("Filter applied");

		return fmUri.name.endsWith(".csv") ? Papa.unparse(rows) : JSON.stringify(rows, null, 2)
	}

	private async upsertDataextensionRows(connectionId: string, customerKey: string, rows: Array<any>): Promise<any> {
		const soapRows: Array<any> = rows.map(row => {
			const o = {
				CustomerKey: customerKey,
				Properties: {
					Property: new Array<any>()
				}
			};

			for (const col in row) {
				if (col.toLowerCase() !== '_customobjectkey') {
					o.Properties.Property.push({
						Name: col,
						Value: row[col]
					});
				}
			}

			return o;
		});

		return ConnectionController.getInstance().soapRequest(connectionId, {
			operation: SoapOperation.UPDATE,
			body: SoapUtils.createUpdateBody(
				"DataExtensionObject",
				soapRows
			)
		});
	}

	private async getDataextensionRows(connectionId: string, customerKey: string, filter?: any): Promise<Array<any>> {
		const columns = await this.getDataextensionColumns(connectionId, customerKey);

		return ConnectionController.getInstance().soapRequest(connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: SoapUtils.createRetrieveBody(
				`DataExtensionObject[${customerKey}]`,
				[
					"_CustomObjectKey",
					...columns.map(c => c.Name.trim())
				],
				filter
			),
			transformResponse: (body) => {
				return SoapUtils.getArrProp(body, "RetrieveResponseMsg.Results").map((e: any) => {
					const row: any = {};

					SoapUtils.getArrProp(e, "Properties.Property").forEach((c: any) => {
						row[SoapUtils.getStrProp(c, "Name")] = SoapUtils.getStrProp(c, "Value");
					});

					return row;
				});
			}
		} as SoapRequestConfig);
	}

	private async getDataextensionColumns(connectionId: string, customerKey: string): Promise<Array<DataextensionColumn>> {
		const columns = await ConnectionController.getInstance().soapRequest(connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: SoapUtils.createRetrieveBody(
				"DataExtensionField",
				[
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
				{
					Property: "DataExtension.CustomerKey",
					SimpleOperator: "equals",
					Value: customerKey
				}
			),
			transformResponse: (body) => {
				return SoapUtils.getArrProp(body, "RetrieveResponseMsg.Results").map((e: any) => {
					return {
						Name: SoapUtils.getStrProp(e, "Name"),
						FieldType: SoapUtils.getStrProp(e, "FieldType"),
						ObjectID: SoapUtils.getStrProp(e, "ObjectID"),
						MaxLength: SoapUtils.getStrProp(e, "MaxLength"),
						Scale: SoapUtils.getStrProp(e, "Scale"),
						IsRequired: SoapUtils.getStrProp(e, "IsRequired"),
						IsPrimaryKey: SoapUtils.getStrProp(e, "IsPrimaryKey"),
						DefaultValue: SoapUtils.getStrProp(e, "DefaultValue"),
						Ordinal: parseInt(SoapUtils.getStrProp(e, "Ordinal") || "0")
					} as DataextensionColumn;
				});
			}
		} as SoapRequestConfig);

		return columns.sort((a: DataextensionColumn, b: DataextensionColumn) => { return a.Ordinal - b.Ordinal });
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

			for (const d of subdirectories) {
				if (d.name === uri.name) {
					return d.id;
				}
			}
		}

		throw new Error(`Path not found: ${uri.globalPath}`);
	}

    private async findDirectories(uri: FolderManagerUri, filter: any): Promise<Array<Directory>> {
		const hasTokenScopes = await ConnectionController.getInstance().hasTokenRequiredScopes(
			uri.connectionId,
			['data_extensions_read', 'data_extensions_write']
		);

		if (!hasTokenScopes) {
			Utils.getInstance().sendTelemetryEvent("error.manager-dataextensions.missing_api_scope", true, true);
			throw new Error('Additional permissions are required for this function: DATA => Data Extensions (Read, Write). Please update your MC installed package and restart VSCode');
		}

		const data = await ConnectionController.getInstance().soapRequest(uri.connectionId, {
			operation: SoapOperation.RETRIEVE,
			body: SoapUtils.createRetrieveBody(
				"DataFolder",
				["ID", "Name", "ParentFolder.ID"],
				filter
			),
			transformResponse: (body) => {
				return SoapUtils.getArrProp(body, "RetrieveResponseMsg.Results").map((e: any) => {
					return {
						id: parseInt(SoapUtils.getStrProp(e, "ID")),
						parentId: parseInt(SoapUtils.getStrProp(e, "ParentFolder.ID")),
						name: SoapUtils.getStrProp(e, "Name")
					} as Directory
				});
			}
		} as SoapRequestConfig);

		if (data === undefined) return [];
        
        return data as Array<Directory>
    }

	private async getSubdirectoriesByDirectoryId(uri: FolderManagerUri, directoryId: number): Promise<Array<Directory>> {
		const data = await this.findDirectories(uri, {
            LeftOperand: {
                Property: "ParentFolder.ID",
                SimpleOperator: "equals",
                Value: directoryId
            },
            LogicalOperator: "AND",
            RightOperand: {
                Property: "ContentType",
                SimpleOperator: "equals",
                Value: this.folderContentType
            }
        });
        
		if (directoryId !== 0) {
			for (const d of data as Array<Directory>) {
				this.directoriesCache.set(uri.getChildPath(d.name), d.id);
			}
		}

		return data;
	}

	private async getRootDirectoryId(uri: FolderManagerUri): Promise<number> {
		if (this.directoriesCache.get(uri.mountPath) !== undefined) {
			return this.directoriesCache.get(uri.mountPath) || 0;
		}

		const subdirectories: Array<Directory> = await this.findDirectories(uri, {
            LeftOperand: {
                Property: "CustomerKey",
                SimpleOperator: "equals",
                Value: this.rootFolderCustomerKey
            },
            LogicalOperator: "AND",
            RightOperand: {
                Property: "ContentType",
                SimpleOperator: "equals",
                Value: this.folderContentType
            }
        });

        /** Access to shared DEs in only possible through the Ent BU */
        if(this.folderContentType == "shared_dataextension" && subdirectories && subdirectories.length == 0){
            throw new Error("Connect to the Enterprise Business Unit (top level) to get access to shared Dataextensions");
        }

        if(!subdirectories || subdirectories.length == 0){
            throw new Error("Can't find the root Dataextensions folder");
        }

		this.directoriesCache.set(uri.globalPath, subdirectories[0].id);

		return subdirectories[0].id;
	}
}
