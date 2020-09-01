'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { MCFS } from './fileSystemProvider';
import { Utils, ConnectionManagerPanel, ConnectionManagerMessage, Connection } from './utils';

let isConfigUpdated = true;
let isConnectionManagerOpened = false;

export async function activate(context: vscode.ExtensionContext) {
	console.log('AMPscript extension activated...');

	try {
		let connections = getConfig('connections');

		const mcfs = new MCFS(connections);

		const panel = new ConnectionManagerPanel();

		const openConnectionManager = () => {
			updateConfigField('notifications', 'hasOpenedConnectionManager', true);

			panel.onMessageReceived = (message: any) => {

				switch (message?.action) {
					case 'SEND_CONFIGS':
						panel.postMessage({
							action: 'SET_CONFIGS',
							content: connections
						} as ConnectionManagerMessage);
						break;

					case 'CONNECT':
						connect(message.content as Connection);
						updateConfigField('notifications', 'hasConnectedToMC', true);
						panel.close();
						break;

					case 'UPDATE':
						connections = message.content;
						mcfs.setConnections(connections);
						updateConfig('connections', connections);
						vscode.window.showInformationMessage('Connections saved. Press "Connect" and then open File Explorer');
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
		vscode.window.showErrorMessage('Ampscript extension error: ' + err.toString());
	}
}

function connect(connection: Connection): void {
	let mcfsUri = vscode.Uri.parse('mcfs://' + connection.account_id + '/');

	if (undefined === vscode.workspace.getWorkspaceFolder(mcfsUri)) {
		vscode.workspace.updateWorkspaceFolders(
			vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 0,
			{
				uri: mcfsUri,
				name: `MCFS_${connection.account_id}: ${connection.name}`
			}
		);
	}
	vscode.window.showInformationMessage(`Connected to ${connection.account_id}. Open File Explorer...`);
}

function getConfig(section: string): any {
	const config = vscode.workspace.getConfiguration('mcfs');
	return config?.get(section);
}

function updateConfig(section: string, value: any) {
	const config = vscode.workspace.getConfiguration('mcfs');

	let updateInterval = setInterval(_ => {
		if (isConfigUpdated) {
			isConfigUpdated = false;
			config?.update(section, value, true).then(_ => {
				isConfigUpdated = true;
				clearInterval(updateInterval);
			});
		}
	}, 5);
}

function updateConfigField(section: string, field: string, value: any) {
	const data = getConfig(section);
	data[field] = value;
	updateConfig(section, data);
}

function enableSnippets(extensionPath: string) {
	Utils.readJSON(extensionPath + '/syntaxes/snippets.json').then(snippets => {
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
	const notifications = getConfig('notifications');

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
				updateConfigField('notifications', 'dontShowConnectionManagerAlert', true);
			}
		});
}

function showPromoPage(externsionPath: string) {
	const notifications = getConfig('notifications');

	if (notifications["hasShownChangelog"]) {
		return false;
	}

	let uri = vscode.Uri.file(path.join(externsionPath, 'MCFSPROMO.md'))

	updateConfigField('notifications', 'hasShownChangelog', true);
	vscode.commands.executeCommand('markdown.showPreview', uri);

	return true;
}