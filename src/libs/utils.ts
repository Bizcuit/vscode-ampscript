import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import TelemetryReporter from 'vscode-extension-telemetry';

export class Utils {

	private static instance: Utils | null = null;
	private channel: vscode.OutputChannel;
	private isConfigUpdated: boolean = true;

	public readonly telemetry: TelemetryReporter;
	private telementryEventLog: Array<string> = [];

	public static readonly extensionId = "sergey-agadzhanov.AMPscript";
	public static get extensionVersion(): string {
		return vscode.extensions.getExtension(Utils.extensionId)?.packageJSON?.version || "";
	}


	static getInstance(): Utils {
		if (Utils.instance === null) {
			Utils.instance = new Utils();
		}

		return Utils.instance;
	}

	constructor() {
		this.channel = vscode.window.createOutputChannel('MCFS');
		this.telemetry = new TelemetryReporter(
			Utils.extensionId,
			Utils.extensionVersion,
			Buffer.from("OTc1M2Y5OTAtOTY0Yy00M2Q2LWFiYTEtYjZiMmQyZmVlZDNi", "base64").toString("utf-8")
		);
	}

	sendTelemetryEvent(event: string, deduplicate: boolean = false) {
		if (deduplicate) {
			if (this.telementryEventLog.includes(event)) return;
			else this.telementryEventLog.push(event);
		}

		this.telemetry.sendTelemetryEvent(event);
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
		let message = '';

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

	delay(time: number) {
		return new Promise((resolve) => {
			setTimeout(() => resolve(time), time);
		});
	}
}

export class WebPanelMessage {
	public action = '';
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

		let content = '';

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
