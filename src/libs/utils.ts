import * as vscode from 'vscode';

export class Utils {

	private static instance: Utils | null = null;
	private channel: vscode.OutputChannel;

	static getInstance(): Utils {
		if (Utils.instance === null) {
			Utils.instance = new Utils();
		}

		return Utils.instance;
	}

	constructor() {
		this.channel = vscode.window.createOutputChannel('MCFS');
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

		this.log('============ ERROR ============');
		this.log(message);
		this.log(JSON.stringify(err, null, 2));
	}

}