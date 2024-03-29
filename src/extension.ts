'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import { MCFS } from './mcfsFileSystemProvider';
import { Connection } from './libs/connectionController';
import { Utils, WebPanel, WebPanelMessage } from './libs/utils';
import { ConnectionController } from './libs/connectionController';
import { FolderManagerUri } from './libs/folderManagerUri';
import { FolderController } from './libs/folderController';

let isConnectionManagerOpened = false;

export async function activate(context: vscode.ExtensionContext) {
	try {
		context.subscriptions.push(Utils.getInstance().telemetry);
		Utils.getInstance().sendTelemetryEvent("activated");
		Utils.getInstance().log('MCFS extension activated');

		const mcfs = new MCFS();
		
		let connections = Utils.getInstance().getConfig('connections');

		ConnectionController.getInstance().setConnections(connections);

		const panel = new WebPanel('mcfs_connection_manager', 'MCFS Connection Manager');

		const openConnectionManager = () => {
			Utils.getInstance().sendTelemetryEvent("connection-manager");
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

        const registeredCommands: Array<string> = [];

		FolderController.getInstance().customActions.forEach((a) => {
            if(registeredCommands.includes(a.command)) return;

            registeredCommands.push(a.command);

			context.subscriptions.push(vscode.commands.registerTextEditorCommand(a.command, async (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit, args: any[]) => {
				Utils.getInstance().sendTelemetryEvent(`customaction-${a.command}`);

				const uri = textEditor?.document?.uri;

				if (uri === undefined) return;

				const fmUri = new FolderManagerUri(uri);
				const currentContent = textEditor.document.getText();

				vscode.window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: a.waitLabel,
					cancellable: true
				}, async (progress, token) => {
                    const result = await FolderController.getInstance().getManager(fmUri.mountFolderName)
                                    ?.customActions
                                    ?.find((c) => c.command == a.command)
                                    ?.callback(fmUri, currentContent);

					if (result !== undefined && currentContent !== result) {
						textEditor.edit((editBuilder) => {
							editBuilder.replace(new vscode.Selection(0, 0, textEditor.document.lineCount, 0), result);
						});
					}

					return;
				});
			}));
		});

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

export function deactivate() {
	Utils.getInstance().telemetry.dispose();
}

function connect(connection: Connection): void {
	Utils.getInstance().sendTelemetryEvent("connect");

	const mcfsUri = vscode.Uri.parse('mcfs://' + connection.account_id + '/');

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
	
	vscode.commands.executeCommand('workbench.view.explorer');
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
	const version = Utils.extensionVersion.split(".", 2).join(".");

	if (notifications["hasSeenPromoForVersion"] === version) {
		return false;
	}

	const uri = vscode.Uri.file(path.join(externsionPath, 'PROMO.md'))

	Utils.getInstance().setConfigField('notifications', 'hasSeenPromoForVersion', version);

	vscode.commands.executeCommand('markdown.showPreview', uri);

	return true;
}