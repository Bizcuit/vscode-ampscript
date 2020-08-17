<template>
	<div id="app">
		<ConnectionList
			:connections="connections"
			v-on:connect="connect($event)"
			v-on:save="save($event)"
		/>
		<Help />
	</div>
</template>

<script>
import ConnectionList from "./components/ConnectionList";

export default {
	name: "app",
	data: function() {
		return {
			vscode: null,
			connections: []
		};
	},
	methods: {
		save: function(connections) {
			this.connections = connections;

			this.vscode.postMessage({
				action: "UPDATE",
				content: connections
			});
		},

		connect: function(connection) {
			this.vscode.postMessage({
				action: "CONNECT",
				content: connection
			});
		},

		onMessageReceived: function(event) {
			switch (event.data.action) {
				case "SET_CONFIGS":
					this.connections = event.data.content;
					break;
				default:
					break;
			}
		}
	},
	mounted: function() {
		/* START: TESTING */
		if (typeof acquireVsCodeApi === "function") {
			this.vscode = acquireVsCodeApi();
		} else {
			this.vscode = {
				postMessage: data => {
					console.log("postMessage", data);
				}
			};
		}
		/* FINISH: TESTING */

		this.vscode.postMessage({
			action: "SEND_CONFIGS"
		});

		window.addEventListener("message", event => {
			this.onMessageReceived(event);
		});
	},
	components: {
		ConnectionList
	}
};
</script>

<style>
</style>
