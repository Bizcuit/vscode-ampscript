import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class Utils {

	private static instance: Utils | null = null;
	private channel: vscode.OutputChannel;
	private isConfigUpdated: boolean = true;

	static getInstance(): Utils {
		if (Utils.instance === null) {
			Utils.instance = new Utils();
		}

		return Utils.instance;
	}

	constructor() {
		this.channel = vscode.window.createOutputChannel('MCFS');
	}

	showInformationMessage(message: string) {
		this.log(message)
		vscode.window.showInformationMessage(message);
	}

	showErrorMessage(err: any): void {
		const message = this.getErrorMessage(err);

		this.logError(err);

		vscode.window.showErrorMessage(message);
	}

	getErrorMessage(err: any): string {
		let message: string = '';

		message += err?.message ? err?.message + '. ' : '';
		message += err?.details ? err?.details + '. ' : '';
		message += err?.data ? err.data : '';

		return message;
	}

	log(message: string) {
		this.channel.appendLine(`${new Date().toISOString()} => ${message}`);
	}

	logError(err: any) {
		const message: string = this.getErrorMessage(err);

		this.log('ERROR ********************************************');
		this.log(message);
		this.log(JSON.stringify(err, null, 2));
		this.log('**************************************************');

	}

	readJSON(path: string): Promise<any> {
		return new Promise((resolve, reject) => {
			fs.readFile(require.resolve(path), (err, data) => {
				if (err) {
					reject(err)
				}
				else {
					resolve(JSON.parse(data.toString('utf-8')));
				}
			})
		});
	}

	getConfig(section: string): any {
		const config = vscode.workspace.getConfiguration('mcfs');
		return config?.get(section);
	}

	setConfig(section: string, value: any) {
		const config = vscode.workspace.getConfiguration('mcfs');

		const updateInterval = setInterval(_ => {
			if (this.isConfigUpdated) {
				this.isConfigUpdated = false;
				config?.update(section, value, true).then(_ => {
					this.isConfigUpdated = true;
					clearInterval(updateInterval);
				});
			}
		}, 100);
	}

	setConfigField(section: string, field: string, value: any) {
		const data = this.getConfig(section);
		data[field] = value;
		this.setConfig(section, data);
	}
}

export class WebPanelMessage {
	public action: string = '';
	public content: any = null;
}

export class WebPanel {
	private panel: vscode.WebviewPanel | undefined;
	private id: string;
	private title: string;

	public onMessageReceived: (message: any) => void;

	constructor(id: string, title: string) {
		this.id = id;
		this.title = title;
		this.onMessageReceived = () => null;
	}

	public open(webviewPath: string): void {
		const webviewPathUri = vscode.Uri.file(webviewPath);
		const indexPath = path.join(webviewPathUri.fsPath, 'index.html');

		this.panel = vscode.window.createWebviewPanel(
			this.id,
			this.title,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [webviewPathUri]
			}
		);

		this.panel?.webview.onDidReceiveMessage((message: any) => {
			this.onMessageReceived(message);
		});

		let content: string = '';

		fs.readFile(indexPath, (err, data) => {
			if (err) {
				Utils.getInstance().logError(err);
				content = `Error: unable to open confirguration manager using path ${indexPath}. ${err.toString()}`;
				return;
			}
			else {
				content = data
					.toString()
					.replace(/\/(css|js|assets|img)\//g, `${this.panel?.webview.asWebviewUri(webviewPathUri)}/$1/`);
			}

			if (this.panel) {
				this.panel.webview.html = content;
			}
		});
	}

	public close() {
		this.panel?.dispose();
	}

	public postMessage(message: WebPanelMessage): void {
		this.panel?.webview.postMessage(message);
	}
}