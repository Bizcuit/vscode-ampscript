(function(){"use strict";var t={3762:function(t,n,e){e(6992),e(8674),e(9601),e(7727);var o=e(144),i=function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("div",{attrs:{id:"app"}},[e("ConnectionList",{attrs:{connections:t.connections},on:{connect:function(n){return t.connect(n)},save:function(n){return t.save(n)}}}),e("Help")],1)},c=[],s=function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("div",{staticClass:"hello"},[e("h2",[t._v("Connections list")]),e("div",{staticStyle:{"margin-bottom":"10px"}},[e("button",{on:{click:function(n){return t.add()}}},[t._v("NEW CONNECTION")]),e("button",{on:{click:function(n){return t.save()}}},[t._v("SAVE CHANGES")])]),e("table",{staticClass:"connections",attrs:{cellpadding:"0",cellspacing:"0",border:"0"}},[t._m(0),e("tbody",t._l(this.localConnections,(function(n,o){return e("tr",{key:o},[e("td",[e("button",{ref:"btn_connect",refInFor:!0,on:{click:function(e){return t.connect(n,o)}}},[t._v("CONNECT")])]),e("td",[e("input",{directives:[{name:"model",rawName:"v-model",value:n.name,expression:"c.name"}],attrs:{type:"text",placeholder:"connection name"},domProps:{value:n.name},on:{change:function(n){t.hasChanges=!0},input:function(e){e.target.composing||t.$set(n,"name",e.target.value)}}})]),e("td",[e("input",{directives:[{name:"model",rawName:"v-model",value:n.account_id,expression:"c.account_id"}],attrs:{type:"text",placeholder:"business unit id"},domProps:{value:n.account_id},on:{change:function(n){t.hasChanges=!0},input:function(e){e.target.composing||t.$set(n,"account_id",e.target.value)}}})]),e("td",[e("input",{directives:[{name:"model",rawName:"v-model",value:n.authBaseUri,expression:"c.authBaseUri"}],attrs:{type:"text",placeholder:"api auth base uri"},domProps:{value:n.authBaseUri},on:{change:function(n){t.hasChanges=!0},input:function(e){e.target.composing||t.$set(n,"authBaseUri",e.target.value)}}})]),e("td",[e("input",{directives:[{name:"model",rawName:"v-model",value:n.client_id,expression:"c.client_id"}],attrs:{type:"password",placeholder:"client id"},domProps:{value:n.client_id},on:{change:function(n){t.hasChanges=!0},input:function(e){e.target.composing||t.$set(n,"client_id",e.target.value)}}})]),e("td",[e("input",{directives:[{name:"model",rawName:"v-model",value:n.client_secret,expression:"c.client_secret"}],attrs:{type:"password",placeholder:"client secret"},domProps:{value:n.client_secret},on:{change:function(n){t.hasChanges=!0},input:function(e){e.target.composing||t.$set(n,"client_secret",e.target.value)}}})]),e("td",[e("button",{staticClass:"delete",on:{click:function(n){return t.remove(o)}}},[t._v("✕")])])])})),0)])])},a=[function(){var t=this,n=t.$createElement,e=t._self._c||n;return e("thead",[e("tr",[e("th",{attrs:{width:"100"}}),e("th",{attrs:{width:"100"}},[t._v("Label")]),e("th",{attrs:{width:"100"}},[t._v("MID")]),e("th",[t._v("Auth Base Uri")]),e("th",{attrs:{width:"200"}},[t._v("Client ID")]),e("th",{attrs:{width:"200"}},[t._v("Client Secret")]),e("th",{attrs:{width:"50§"}})])])}],r=(e(561),e(7042),{name:"connectionList",props:{connections:Array},data:function(){return{localConnections:[],hasChanges:!1}},methods:{add:function(){this.hasChanges=!0,this.localConnections.push({name:"my connection "+(this.localConnections.length+1),account_id:"",authBaseUri:"",client_id:"",client_secret:""})},remove:function(t){this.localConnections.splice(t,1)},connect:function(t,n){var e=this;this.$refs.btn_connect&&this.$refs.btn_connect.length>n&&(this.$refs.btn_connect[n].setAttribute("disabled","true"),this.$refs.btn_connect[n].innerHTML="CONNECTED"),this.hasChanges&&this.save(),setTimeout((function(){e.$emit("connect",t)}),100)},save:function(){this.hasChanges=!1,this.$emit("save",this.localConnections)}},watch:{connections:function(t){this.localConnections=t.slice(0)}},components:{}}),u=r,l=e(1001),d=(0,l.Z)(u,s,a,!1,null,"e7f38064",null),h=d.exports,f={name:"app",data:function(){return{vscode:null,connections:[]}},methods:{save:function(t){this.connections=t,this.vscode.postMessage({action:"UPDATE",content:t})},connect:function(t){this.vscode.postMessage({action:"CONNECT",content:t})},onMessageReceived:function(t){switch(t.data.action){case"SET_CONFIGS":this.connections=t.data.content;break;default:break}}},mounted:function(){var t=this;"function"===typeof acquireVsCodeApi?this.vscode=acquireVsCodeApi():this.vscode={postMessage:function(t){console.log("postMessage",t)}},this.vscode.postMessage({action:"SEND_CONFIGS"}),window.addEventListener("message",(function(n){t.onMessageReceived(n)}))},components:{ConnectionList:h}},p=f,v=(0,l.Z)(p,i,c,!1,null,null,null),m=v.exports;o.Z.config.productionTip=!1,new o.Z({render:function(t){return t(m)}}).$mount("#app")}},n={};function e(o){var i=n[o];if(void 0!==i)return i.exports;var c=n[o]={exports:{}};return t[o](c,c.exports,e),c.exports}e.m=t,function(){var t=[];e.O=function(n,o,i,c){if(!o){var s=1/0;for(l=0;l<t.length;l++){o=t[l][0],i=t[l][1],c=t[l][2];for(var a=!0,r=0;r<o.length;r++)(!1&c||s>=c)&&Object.keys(e.O).every((function(t){return e.O[t](o[r])}))?o.splice(r--,1):(a=!1,c<s&&(s=c));if(a){t.splice(l--,1);var u=i();void 0!==u&&(n=u)}}return n}c=c||0;for(var l=t.length;l>0&&t[l-1][2]>c;l--)t[l]=t[l-1];t[l]=[o,i,c]}}(),function(){e.d=function(t,n){for(var o in n)e.o(n,o)&&!e.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:n[o]})}}(),function(){e.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"===typeof window)return window}}()}(),function(){e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)}}(),function(){var t={143:0};e.O.j=function(n){return 0===t[n]};var n=function(n,o){var i,c,s=o[0],a=o[1],r=o[2],u=0;if(s.some((function(n){return 0!==t[n]}))){for(i in a)e.o(a,i)&&(e.m[i]=a[i]);if(r)var l=r(e)}for(n&&n(o);u<s.length;u++)c=s[u],e.o(t,c)&&t[c]&&t[c][0](),t[c]=0;return e.O(l)},o=self["webpackChunkmcfs_connection_manager"]=self["webpackChunkmcfs_connection_manager"]||[];o.forEach(n.bind(null,0)),o.push=n.bind(null,o.push.bind(o))}();var o=e.O(void 0,[998],(function(){return e(3762)}));o=e.O(o)})();
//# sourceMappingURL=app-legacy.js.map