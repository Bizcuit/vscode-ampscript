(function(t){function e(e){for(var o,r,a=e[0],s=e[1],u=e[2],d=0,p=[];d<a.length;d++)r=a[d],Object.prototype.hasOwnProperty.call(c,r)&&c[r]&&p.push(c[r][0]),c[r]=0;for(o in s)Object.prototype.hasOwnProperty.call(s,o)&&(t[o]=s[o]);l&&l(e);while(p.length)p.shift()();return i.push.apply(i,u||[]),n()}function n(){for(var t,e=0;e<i.length;e++){for(var n=i[e],o=!0,a=1;a<n.length;a++){var s=n[a];0!==c[s]&&(o=!1)}o&&(i.splice(e--,1),t=r(r.s=n[0]))}return t}var o={},c={app:0},i=[];function r(e){if(o[e])return o[e].exports;var n=o[e]={i:e,l:!1,exports:{}};return t[e].call(n.exports,n,n.exports,r),n.l=!0,n.exports}r.m=t,r.c=o,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(t,e){if(1&e&&(t=r(t)),8&e)return t;if(4&e&&"object"===typeof t&&t&&t.__esModule)return t;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var o in t)r.d(n,o,function(e){return t[e]}.bind(null,o));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="/";var a=window["webpackJsonp"]=window["webpackJsonp"]||[],s=a.push.bind(a);a.push=e,a=a.slice();for(var u=0;u<a.length;u++)e(a[u]);var l=s;i.push([0,"chunk-vendors"]),n()})({0:function(t,e,n){t.exports=n("56d7")},5191:function(t,e,n){"use strict";var o=n("a2a7"),c=n.n(o);c.a},"56d7":function(t,e,n){"use strict";n.r(e);n("e260"),n("e6cf"),n("cca6"),n("a79d");var o=n("2b0e"),c=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{attrs:{id:"app"}},[n("ConnectionList",{attrs:{connections:t.connections},on:{connect:function(e){return t.connect(e)},save:function(e){return t.save(e)}}}),n("Help")],1)},i=[],r=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"hello"},[n("h2",[t._v("Connections list")]),n("div",{staticStyle:{"margin-bottom":"10px"}},[n("button",{on:{click:function(e){return t.add()}}},[t._v("NEW CONNECTION")]),n("button",{on:{click:function(e){return t.save()}}},[t._v("SAVE CHANGES")])]),n("table",{staticClass:"connections",attrs:{cellpadding:"0",cellspacing:"0",border:"0"}},[t._m(0),n("tbody",t._l(this.localConnections,(function(e,o){return n("tr",{key:o},[n("td",[n("button",{ref:"btn_connect",refInFor:!0,on:{click:function(n){return t.connect(e,o)}}},[t._v("CONNECT")])]),n("td",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.name,expression:"c.name"}],attrs:{type:"text",placeholder:"connection name"},domProps:{value:e.name},on:{input:function(n){n.target.composing||t.$set(e,"name",n.target.value)}}})]),n("td",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.account_id,expression:"c.account_id"}],attrs:{type:"text",placeholder:"business unit id"},domProps:{value:e.account_id},on:{input:function(n){n.target.composing||t.$set(e,"account_id",n.target.value)}}})]),n("td",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.authBaseUri,expression:"c.authBaseUri"}],attrs:{type:"text",placeholder:"api auth base uri"},domProps:{value:e.authBaseUri},on:{input:function(n){n.target.composing||t.$set(e,"authBaseUri",n.target.value)}}})]),n("td",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.client_id,expression:"c.client_id"}],attrs:{type:"password",placeholder:"client id"},domProps:{value:e.client_id},on:{input:function(n){n.target.composing||t.$set(e,"client_id",n.target.value)}}})]),n("td",[n("input",{directives:[{name:"model",rawName:"v-model",value:e.client_secret,expression:"c.client_secret"}],attrs:{type:"password",placeholder:"client secret"},domProps:{value:e.client_secret},on:{input:function(n){n.target.composing||t.$set(e,"client_secret",n.target.value)}}})]),n("td",[n("button",{staticClass:"delete",on:{click:function(e){return t.remove(o)}}},[t._v("✕")])])])})),0)])])},a=[function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("thead",[n("tr",[n("th",{attrs:{width:"100"}}),n("th",{attrs:{width:"100"}},[t._v("Label")]),n("th",{attrs:{width:"100"}},[t._v("MID")]),n("th",[t._v("Auth Base Uri")]),n("th",{attrs:{width:"200"}},[t._v("Client ID")]),n("th",{attrs:{width:"200"}},[t._v("Client Secret")]),n("th",{attrs:{width:"50§"}})])])}],s=(n("fb6a"),n("a434"),{name:"connectionList",props:{connections:Array},data:function(){return{localConnections:[]}},methods:{add:function(){this.localConnections.push({name:"my connection "+(this.localConnections.length+1),account_id:"",authBaseUri:"",client_id:"",client_secret:""})},remove:function(t){this.localConnections.splice(t,1)},connect:function(t,e){this.$refs.btn_connect&&this.$refs.btn_connect.length>e&&(this.$refs.btn_connect[e].setAttribute("disabled","true"),this.$refs.btn_connect[e].innerHTML="CONNECTED"),this.$emit("connect",t)},save:function(){this.$emit("save",this.localConnections)}},watch:{connections:function(t){this.localConnections=t.slice(0)}},components:{}}),u=s,l=(n("5191"),n("2877")),d=Object(l["a"])(u,r,a,!1,null,"08438ce8",null),p=d.exports,f={name:"app",data:function(){return{vscode:null,connections:[]}},methods:{save:function(t){this.connections=t,this.vscode.postMessage({action:"UPDATE",content:t})},connect:function(t){this.vscode.postMessage({action:"CONNECT",content:t})},onMessageReceived:function(t){switch(t.data.action){case"SET_CONFIGS":this.connections=t.data.content;break;default:break}}},mounted:function(){var t=this;"function"===typeof acquireVsCodeApi?this.vscode=acquireVsCodeApi():this.vscode={postMessage:function(t){console.log("postMessage",t)}},this.vscode.postMessage({action:"SEND_CONFIGS"}),window.addEventListener("message",(function(e){t.onMessageReceived(e)}))},components:{ConnectionList:p}},v=f,h=Object(l["a"])(v,c,i,!1,null,null,null),m=h.exports;o["a"].config.productionTip=!1,new o["a"]({render:function(t){return t(m)}}).$mount("#app")},a2a7:function(t,e,n){}});
//# sourceMappingURL=app.js.map