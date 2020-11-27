'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MCFS } from './mcfsFileSystemProvider';
import { Connection } from './libs/connectionController';
import { Utils, WebPanel, WebPanelMessage } from './libs/utils';
import { ConnectionController } from './libs/connectionController';

let isConnectionManagerOpened = false;

export async function activate(context: vscode.ExtensionContext) {
	Utils.getInstance().log('MCFS extension activated');

	try {
		const mcfs = new MCFS();
		 
		let connections = Utils.getInstance().getConfig('connections');

		ConnectionController.getInstance().setConnections(connections);

		const panel = new WebPanel('mcfs_connection_manager', 'MCFS Connection Manager');

		const openConnectionManager = () => {
			Utils.getInstance().setConfigField('notifications', 'hasOpenedConnectionManager', true);

			panel.onMessageReceived = (message: any) => {

				switch (message?.action) {
					case 'SEND_CONFIGS':
						panel.postMessage({
							action: 'SET_CONFIGS',
							content: connections
						} as WebPanelMessage);
						break;

					case 'CONNECT':
						connect(message.content as Connection);
						Utils.getInstance().setConfigField('notifications', 'hasConnectedToMC', true);
						panel.close();
						break;

					case 'UPDATE':
						connections = message.content;
						ConnectionController.getInstance().setConnections(connections);
						Utils.getInstance().setConfig('connections', connections);
						Utils.getInstance().showInformationMessage('Connections saved. Press "Connect" and then open File Explorer');
						break;
				}
			};

			panel.open(path.join(context.extensionPath, 'connection-manager'));
		};

		context.subscriptions.push(vscode.workspace.registerFileSystemProvider('mcfs', mcfs, { isCaseSensitive: false }));

		context.subscriptions.push(vscode.commands.registerCommand('mcfs.open', _ => {
			isConnectionManagerOpened = true;
			openConnectionManager();
		}));

		setTimeout(_ => {
			if (!isConnectionManagerOpened) {
				if (!showPromoPage(context.extensionPath)) {
					showPromoBanner(openConnectionManager);
				}
			}
		}, 5000);

		enableSnippets(context.extensionPath);
	}
	catch (err) {
		Utils.getInstance().showErrorMessage(err);
	}
}

function connect(connection: Connection): void {
	let mcfsUri = vscode.Uri.parse('mcfs://' + connection.account_id + '/');

	//TODO: replace folder

	if (undefined === vscode.workspace.getWorkspaceFolder(mcfsUri)) {
		vscode.workspace.updateWorkspaceFolders(
			vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 0,
			{
				uri: mcfsUri,
				name: `MCFS_${connection.account_id}: ${connection.name}`
			}
		);
	}

	Utils.getInstance().showInformationMessage(`Connected to ${connection.account_id}. Open File Explorer...`);
}

function enableSnippets(extensionPath: string) {
	Utils.getInstance().readJSON(extensionPath + '/syntaxes/snippets.json').then(snippets => {
		vscode.languages.registerHoverProvider('AMPscript', {
			provideHover(document, position, token) {
				let word = document.getText(document.getWordRangeAtPosition(position));

				if (!word || word.length > 100) {
					return null;
				}

				word = word.toLowerCase();

				if (snippets[word] !== undefined && snippets[word].description) {
					return {
						contents: [snippets[word].description]
					};
				}
				return null;
			}
		});
	});
}

function showPromoBanner(connectionManagerCallback: () => void) {
	const notifications = Utils.getInstance().getConfig('notifications');

	if (!notifications || notifications["dontShowConnectionManagerAlert"] || notifications["hasConnectedToMC"]) {
		return;
	}

	vscode.window.showInformationMessage(
		`Would you like to connect VSCode directly to Marketing Cloud?`,
		"YES, SOUNDS INTERESTING",
		"CHECK ON GITHUB",
		"NO")
		.then(selection => {
			if (selection == "YES, SOUNDS INTERESTING") {
				connectionManagerCallback();
			}
			else if (selection == "CHECK ON GITHUB") {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/Bizcuit/vscode-ampscript'));
			}
			else if (selection == "NO") {
				Utils.getInstance().setConfigField('notifications', 'dontShowConnectionManagerAlert', true);
			}
		});
}

function showPromoPage(externsionPath: string) {
	const notifications = Utils.getInstance().getConfig('notifications');

	if (notifications["hasShownChangelog"]) {
		return false;
	}

	let uri = vscode.Uri.file(path.join(externsionPath, 'PROMO.md'))

	Utils.getInstance().setConfigField('notifications', 'hasShownChangelog', true);
	vscode.commands.executeCommand('markdown.showPreview', uri);

	return true;
}