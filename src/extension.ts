'use strict';

import * as vscode from 'vscode';
import * as path from 'path';

import { MCFS } from './fileSystemProvider';
import { Utils, ConnectionManagerPanel, ConnectionManagerMessage, Connection } from './utils';

let isConfigUpdated = true;

export function activate(context: vscode.ExtensionContext) {
	console.log("MCFS is activated...");

	showPromoBanner();

	let connections = getConfig('connections');

	const mcfs = new MCFS(connections);

	const panel = new ConnectionManagerPanel();

	context.subscriptions.push(vscode.workspace.registerFileSystemProvider('mcfs', mcfs, { isCaseSensitive: false }));

	context.subscriptions.push(vscode.commands.registerCommand('mcfs.open', _ => {
		console.log("Utils.isMcfsInitialized() = ", Utils.isMcfsInitialized());

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
					panel.close();
					connect(message.content as Connection);
					updateConfigField('notifications', 'hasConnectedToMC', true);
					break;

				case 'UPDATE':
					connections = message.content;
					mcfs.setConnections(connections);
					updateConfigField('notifications', 'hasConnectedToMC', true);

			}
		};

		panel.open(path.join(context.extensionPath, 'connection-manager'));
	}));

	vscode.languages.registerHoverProvider('AMPscript', {
		provideHover(document, position, token) {
			let word = document.getText(document.getWordRangeAtPosition(position));
			return {
				contents: ['Hover Content: ' + word]
			};
		}
	});
}

function connect(connection: Connection): void {
	vscode.workspace.updateWorkspaceFolders(
		vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, 0,
		{
			uri: vscode.Uri.parse('mcfs://' + connection.account_id),
			name: 'MCFS_' + connection.account_id
		}
	);
	vscode.window.showInformationMessage(`Connected to ${connection.account_id}. Open File Explorer...`);
}

function updateConfig(section: string, value: any) {
	const config = vscode.workspace.getConfiguration('mcfs');

	let updateInterval = setInterval(_ => {
		if (isConfigUpdated) {
			isConfigUpdated = false;
			config.update(section, value, true).then(_ => {
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

function getConfig(section: string): any {
	const config = vscode.workspace.getConfiguration('mcfs');
	return config.get(section);
}

function showPromoBanner() {
	const notifications = getConfig('notifications');

	if (!notifications || notifications["dontShowConnectionManagerAlert"] || notifications["hasConnectedToMC"]) {
		return;
	}

	vscode.window.showInformationMessage(
		`Would you like to connect VSCode directly to Marketing Cloud?`,
		"I WANT TO KNOW MORE",
		"I DON'T CARE")
		.then(selection => {
			if (selection == "I WANT TO KNOW MORE") {
				vscode.env.openExternal(vscode.Uri.parse('https://github.com/Bizcuit/vscode-ampscript'));
			}
			else if (selection == "I DON'T CARE") {
				updateConfigField('notifications', 'dontShowConnectionManagerAlert', true);
			}
		});
}