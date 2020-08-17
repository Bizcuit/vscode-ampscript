import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class ConnectionManagerMessage {
	public action: string = '';
	public content: any = null;
}

export class Connection {
	public authBaseUri: string = '';
	public name: string = '';
	public account_id: string = '';
	public client_id: string = '';
	public client_secret: string = '';
	public grant_type: string = '';
}

export class ConnectionManagerPanel {
	private panel: vscode.WebviewPanel | null = null;

	public onMessageReceived: (message: any) => void = () => null;

	public open(webviewPath: string): void {
		const webviewPathUri = vscode.Uri.file(webviewPath);
		const indexPath = path.join(webviewPathUri.fsPath, 'index.html');

		this.panel = vscode.window.createWebviewPanel(
			'mcfs_connection_manager',
			'MCFS Connection Manager',
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

	public postMessage(message: ConnectionManagerMessage): void {
		this.panel?.webview.postMessage(message);
	}
}

export class Utils {
	public static isMcfsInitialized() {
		return vscode.workspace
			&& vscode.workspace.workspaceFolders
			&& vscode.workspace.workspaceFolders.findIndex(v => v.uri.scheme === 'mcfs') >= 0
			|| false;
	}

	public static readJSON(path: string): Promise<any> {
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
}