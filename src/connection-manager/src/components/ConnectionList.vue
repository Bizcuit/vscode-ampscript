<template>
	<div class="hello">
		<h2>Connections list</h2>

		<div style="margin-bottom: 10px;">
			<button @click="add()">NEW CONNECTION</button>
			<button @click="save()">SAVE CHANGES</button>
		</div>

		<table cellpadding="0" cellspacing="0" border="0" class="connections">
			<thead>
				<tr>
					<th width="100">&nbsp;</th>
					<th width="100">Label</th>
					<th width="100">MID</th>
					<th>Auth Base Uri</th>
					<th width="200">Client ID</th>
					<th width="200">Client Secret</th>
					<th width="50§">&nbsp;</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(c, i) in this.localConnections" :key="i">
					<td>
						<button @click="connect(c, i)" ref="btn_connect">CONNECT</button>
					</td>
					<td>
						<input
							type="text"
							v-model="c.name"
							placeholder="connection name"
							v-on:change="hasChanges = true"
						/>
					</td>
					<td>
						<input
							type="text"
							v-model="c.account_id"
							placeholder="business unit id"
							v-on:change="hasChanges = true"
						/>
					</td>
					<td>
						<input
							type="text"
							v-model="c.authBaseUri"
							placeholder="api auth base uri"
							v-on:change="hasChanges = true"
						/>
					</td>
					<td>
						<input
							type="password"
							v-model="c.client_id"
							placeholder="client id"
							v-on:change="hasChanges = true"
						/>
					</td>
					<td>
						<input
							type="password"
							v-model="c.client_secret"
							placeholder="client secret"
							v-on:change="hasChanges = true"
						/>
					</td>
					<td>
						<button class="delete" @click="remove(i)">&#10005;</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script>
export default {
	name: "connectionList",
	props: {
		connections: Array,
	},
	data: function () {
		return {
			localConnections: [],
			hasChanges: false,
		};
	},
	methods: {
		add: function () {
			this.hasChanges = true;
			this.localConnections.push({
				name: "my connection " + (this.localConnections.length + 1),
				account_id: "",
				authBaseUri: "",
				client_id: "",
				client_secret: "",
			});
		},

		remove: function (index) {
			//this.hasChanges = true;
			this.localConnections.splice(index, 1);
		},

		connect: function (connection, index) {
			if (
				this.$refs.btn_connect &&
				this.$refs.btn_connect.length > index
			) {
				this.$refs.btn_connect[index].setAttribute("disabled", "true");
				this.$refs.btn_connect[index].innerHTML = "CONNECTED";
			}

			if (this.hasChanges) {
				this.save();
			}

			setTimeout(() => {
				this.$emit("connect", connection);
			}, 100);
		},

		save: function () {
			this.hasChanges = false;
			this.$emit("save", this.localConnections);
		},
	},
	watch: {
		connections: function (newVal) {
			this.localConnections = newVal.slice(0);
		},
	},

	components: {},
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.vscode-dark input {
	color: #dddddd;
}

.vscode-light input {
	color: #444444;
}

.vscode-dark button {
	background-color: #333333;
	color: #dddddd;
}

.vscode-light button {
	background-color: #dddddd;
	color: #333333;
}

.connections {
	width: 100%;
}
.connections td,
.connections th {
	text-align: left;
	border-bottom: solid 1px #444444;
}

.connections td {
	padding: 5px 0px;
}

.connections th {
	padding: 5px 7px;
}

.connections input {
	display: block;
	width: 100%;
	box-sizing: border-box;
	padding: 10px 5px;
	text-overflow: ellipsis;
	border: 0px;
	border-left: solid 2px transparent;
	outline: 0;
	background: transparent;
}

.connections input:focus {
	border-left: solid 2px blue;
}

button {
	margin-right: 10px;
	border: solid 1px #dddddd;
	border-radius: 3px;
	cursor: pointer;
}

button.delete {
	background-color: darkred;
	color: lightgray !important;
}

button:disabled {
	cursor: not-allowed;
	color: #999999;
}
</style>
