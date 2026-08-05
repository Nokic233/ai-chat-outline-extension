var content=(function(){"use strict";var Q=Object.defineProperty;var G=(p,d,m)=>d in p?Q(p,d,{enumerable:!0,configurable:!0,writable:!0,value:m}):p[d]=m;var l=(p,d,m)=>G(p,typeof d!="symbol"?d+"":d,m);var A,M;function p(o){return o}class d{getScrollContainer(){const t=Array.from(document.querySelectorAll("*"));for(const e of t){const n=window.getComputedStyle(e);if((n.overflowY==="auto"||n.overflowY==="scroll")&&e.scrollHeight>e.clientHeight&&e.clientHeight>300)return e}return window}observe(t){const e=new MutationObserver(()=>{t()});return e.observe(document.body,{childList:!0,subtree:!0,characterData:!0}),()=>e.disconnect()}isDarkMode(){const t=document.documentElement.getAttribute("data-theme")||document.documentElement.className,e=document.body.className,n=s=>/dark/i.test(s),r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;return n(t)||n(e)||r}createQuestionItem(t,e,n){const r=e.trim().replace(/\s+/g," "),s=40,i=r.length>s?r.substring(0,s)+"...":r;return t.id||(t.id=`ai-chat-q-${n}-${Date.now().toString(36)}`),{id:t.id,text:i||`提问 #${n+1}`,fullText:r||`提问 #${n+1}`,element:t,index:n}}}class m extends d{constructor(){super(...arguments);l(this,"name","Google Gemini")}isMatch(e){return e.includes("gemini.google.com")}getUserMessages(){const e=["user-query",".user-query",'[data-test-id="user-query"]',".query-text",".user-query-container",'div[class*="query-content"]'],n=[];return e.forEach(s=>{Array.from(document.querySelectorAll(s)).forEach(a=>{n.includes(a)||n.push(a)})}),n.filter(s=>{var a;return!((a=s.parentElement)==null?void 0:a.closest(e.join(",")))}).map((s,i)=>{const a=s.innerText||s.textContent||"";return this.createQuestionItem(s,a,i)})}}class C extends d{constructor(){super(...arguments);l(this,"name","ChatGPT")}isMatch(e){return e.includes("chatgpt.com")||e.includes("chat.openai.com")}getUserMessages(){const e=['[data-message-author-role="user"]','div[class*="user-message"]','div[data-is-user-message="true"]'],n=[];return e.forEach(s=>{Array.from(document.querySelectorAll(s)).forEach(a=>{n.includes(a)||n.push(a)})}),n.filter(s=>{var a;return!((a=s.parentElement)==null?void 0:a.closest(e.join(",")))}).map((s,i)=>{const a=s.innerText||s.textContent||"";return this.createQuestionItem(s,a,i)})}}class q extends d{constructor(){super(...arguments);l(this,"name","Claude")}isMatch(e){return e.includes("claude.ai")}getUserMessages(){const e=['[data-testid="user-message"]',".font-user-message",'div[class*="UserMessage"]'],n=[];return e.forEach(r=>{Array.from(document.querySelectorAll(r)).forEach(i=>{n.includes(i)||n.push(i)})}),n.map((r,s)=>{const i=r.innerText||r.textContent||"";return this.createQuestionItem(r,i,s)})}}class L extends d{constructor(){super(...arguments);l(this,"name","DeepSeek")}isMatch(e){return e.includes("chat.deepseek.com")}getUserMessages(){const e=[".fbb737a4",'[class*="user-message"]','div[class*="ds-message-user"]','div[class*="user"]'],n=[];return e.forEach(s=>{Array.from(document.querySelectorAll(s)).forEach(a=>{var c;!n.includes(a)&&((c=a.innerText)!=null&&c.trim())&&n.push(a)})}),n.filter(s=>{var a;return!((a=s.parentElement)==null?void 0:a.closest(e.join(",")))}).map((s,i)=>{const a=s.innerText||s.textContent||"";return this.createQuestionItem(s,a,i)})}}class K extends d{constructor(){super(...arguments);l(this,"name","Kimi")}isMatch(e){return e.includes("kimi.moonshot.cn")}getUserMessages(){const e=[".segment-user",'[class*="segment-user"]','[class*="user-segment"]'],n=[];return e.forEach(r=>{Array.from(document.querySelectorAll(r)).forEach(i=>{n.includes(i)||n.push(i)})}),n.map((r,s)=>{const i=r.innerText||r.textContent||"";return this.createQuestionItem(r,i,s)})}}class T extends d{constructor(){super(...arguments);l(this,"name","AI Chat (Generic)")}isMatch(){return!0}getUserMessages(){const e=['[data-role="user"]','[data-author="user"]',".user-message",".human-message",'[class*="user-query"]','[class*="UserMessage"]'],n=[];return e.forEach(r=>{Array.from(document.querySelectorAll(r)).forEach(i=>{var a;!n.includes(i)&&((a=i.innerText)!=null&&a.trim())&&n.push(i)})}),n.map((r,s)=>{const i=r.innerText||r.textContent||"";return this.createQuestionItem(r,i,s)})}}const P=[new m,new C,new q,new L,new K,new T];function $(o=window.location.href){return P.find(e=>e.isMatch(o))||new T}const _=`/* Root container reset */
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  z-index: 999999;
  position: fixed;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color-scheme: dark light;
}

.outline-root {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  user-select: none;
}

/* 宿主深色模式 */
.outline-root.dark {
  --bg-color: #1e1f22;
  --bg-hover: #2b2d31;
  --text-main: #e3e5e8;
  --text-muted: #949ba4;
  --border-color: rgba(255, 255, 255, 0.08);
  --shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  --active-color: #4785ff;
  --dash-color: #4e5058;
}

/* 宿主浅色模式 */
.outline-root.light {
  --bg-color: #ffffff;
  --bg-hover: #f2f3f5;
  --text-main: #2e3338;
  --text-muted: #747f8d;
  --border-color: rgba(0, 0, 0, 0.08);
  --shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  --active-color: #1a73e8;
  --dash-color: #b5bac1;
}

/* 1. 折叠模式：短线指示器 */
.collapsed-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding: 10px 8px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.85;
}

.collapsed-bar:hover {
  opacity: 1;
  transform: scale(1.05);
}

.dash-item {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  background-color: var(--dash-color);
  transition: all 0.2s ease;
}

.dash-item.active {
  width: 18px;
  height: 4px;
  background-color: var(--active-color);
  box-shadow: 0 0 8px rgba(71, 133, 255, 0.5);
}

/* 2. 展开模式：精美卡片面板 */
.expanded-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  max-height: 75vh;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
  backdrop-filter: blur(12px);
  animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px 14px;
  border-bottom: 1px solid var(--border-color);
}

.title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  background: var(--bg-hover);
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 12px;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.icon-btn.active {
  color: var(--active-color);
  background: var(--bg-hover);
}

/* Search bar */
.search-container {
  padding: 8px 12px;
}

.search-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-hover);
  color: var(--text-main);
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--active-color);
}

/* Question List */
.question-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px 12px 8px;
  overflow-y: auto;
  max-height: 50vh;
}

.question-list::-webkit-scrollbar {
  width: 4px;
}

.question-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

/* List Item (与图片1一致：右侧带有小横线，当前项蓝色高亮) */
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  color: var(--text-main);
  font-size: 13px;
  line-height: 1.4;
}

.list-item:hover {
  background: var(--bg-hover);
}

.list-item.active {
  color: var(--active-color);
  font-weight: 500;
}

.item-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-dash {
  width: 12px;
  height: 3px;
  border-radius: 2px;
  background-color: var(--dash-color);
  flex-shrink: 0;
}

.list-item.active .item-dash {
  width: 14px;
  height: 4px;
  background-color: var(--active-color);
  box-shadow: 0 0 6px rgba(71, 133, 255, 0.4);
}

.empty-tip {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
}

/* 全局目标消息卡片闪烁强调效果 (注入宿主) */
@keyframes aiOutlinePulse {
  0% { outline: 2px solid var(--active-color); box-shadow: 0 0 12px rgba(71, 133, 255, 0.6); }
  100% { outline: 2px solid transparent; box-shadow: none; }
}

.ai-outline-highlight {
  animation: aiOutlinePulse 2s ease-out;
  border-radius: 8px;
}
`;class U{constructor(t){l(this,"hostEl");l(this,"shadowRoot");l(this,"adapter");l(this,"items",[]);l(this,"activeIndex",-1);l(this,"isExpanded",!1);l(this,"isPinned",!1);l(this,"filterKeyword","");l(this,"containerEl",null);l(this,"scrollUnbind");this.adapter=t,this.hostEl=document.createElement("div"),this.hostEl.id="ai-chat-outline-host",this.shadowRoot=this.hostEl.attachShadow({mode:"open"});const e=document.createElement("style");e.textContent=_,this.shadowRoot.appendChild(e),document.body.appendChild(this.hostEl),this.render(),this.setupScrollListener()}updateItems(t){this.items=t,this.render()}setupScrollListener(){const t=this.adapter.getScrollContainer(),e=()=>{if(this.items.length===0)return;const n=window.innerHeight/3;let r=0,s=1/0;this.items.forEach((i,a)=>{const c=i.element.getBoundingClientRect(),h=Math.abs(c.top-n);h<s&&(s=h,r=a)}),this.activeIndex!==r&&(this.activeIndex=r,this.updateActiveHighlight())};t.addEventListener("scroll",e,{passive:!0}),this.scrollUnbind=()=>t.removeEventListener("scroll",e)}render(){var n,r,s,i;let t=this.shadowRoot.querySelector(".outline-root");t?t.className=`outline-root ${(i=(s=this.adapter).isDarkMode)!=null&&i.call(s)?"dark":"light"}`:(t=document.createElement("div"),t.className=`outline-root ${(r=(n=this.adapter).isDarkMode)!=null&&r.call(n)?"dark":"light"}`,this.shadowRoot.appendChild(t));const e=this.items.filter(a=>a.fullText.toLowerCase().includes(this.filterKeyword.toLowerCase()));if(this.isExpanded){t.innerHTML=`
        <div class="expanded-panel">
          <div class="panel-header">
            <div class="title-group">
              <span class="panel-title">提问大纲</span>
              <span class="badge">${this.items.length}</span>
            </div>
            <div class="header-actions">
              <button class="icon-btn copy-btn" title="复制提问 Markdown">📋</button>
              <button class="icon-btn pin-btn ${this.isPinned?"active":""}" title="${this.isPinned?"取消固定":"钉住固定"}">📌</button>
              <button class="icon-btn close-btn" title="折叠大纲">✕</button>
            </div>
          </div>
          
          <div class="search-container">
            <input type="text" class="search-input" placeholder="搜索提问..." value="${this.filterKeyword}" />
          </div>

          <div class="question-list">
            ${e.length>0?e.map(u=>`
              <div class="list-item ${u.index===this.activeIndex?"active":""}" data-index="${u.index}" title="${this.escapeHtml(u.fullText)}">
                <span class="item-text">${this.escapeHtml(u.text)}</span>
                <span class="item-dash"></span>
              </div>
            `).join(""):'<div class="empty-tip">未找到相关提问</div>'}
          </div>
        </div>
      `;const a=t.querySelector(".expanded-panel");this.isPinned||a.addEventListener("mouseleave",()=>{this.isExpanded=!1,this.render()});const c=t.querySelector(".search-input");c==null||c.addEventListener("input",u=>{this.filterKeyword=u.target.value,this.render();const b=this.shadowRoot.querySelector(".search-input");b==null||b.focus()});const h=t.querySelector(".pin-btn");h==null||h.addEventListener("click",()=>{this.isPinned=!this.isPinned,this.render()});const f=t.querySelector(".close-btn");f==null||f.addEventListener("click",()=>{this.isExpanded=!1,this.isPinned=!1,this.render()});const k=t.querySelector(".copy-btn");k==null||k.addEventListener("click",()=>{this.copyAsMarkdown()}),t.querySelectorAll(".list-item").forEach(u=>{u.addEventListener("click",()=>{const b=parseInt(u.getAttribute("data-index")||"0",10);this.scrollToQuestion(b)})})}else{const a=Math.max(this.items.length,1);t.innerHTML=`
        <div class="collapsed-bar" title="提问大纲 (${this.items.length})">
          ${Array.from({length:a}).map((h,f)=>`
            <div class="dash-item ${f===this.activeIndex?"active":""}"></div>
          `).join("")}
        </div>
      `;const c=t.querySelector(".collapsed-bar");c==null||c.addEventListener("mouseenter",()=>{this.isExpanded=!0,this.render()}),c==null||c.addEventListener("click",()=>{this.isExpanded=!0,this.render()})}}updateActiveHighlight(){const t=this.shadowRoot.querySelector(".outline-root");t&&(this.isExpanded?t.querySelectorAll(".list-item").forEach(n=>{parseInt(n.getAttribute("data-index")||"0",10)===this.activeIndex?n.classList.add("active"):n.classList.remove("active")}):t.querySelectorAll(".dash-item").forEach((n,r)=>{r===this.activeIndex?n.classList.add("active"):n.classList.remove("active")}))}scrollToQuestion(t){const e=this.items.find(n=>n.index===t);e&&(this.activeIndex=t,this.updateActiveHighlight(),e.element.scrollIntoView({behavior:"smooth",block:"center"}),e.element.classList.remove("ai-outline-highlight"),e.element.offsetWidth,e.element.classList.add("ai-outline-highlight"),setTimeout(()=>{e.element.classList.remove("ai-outline-highlight")},2e3))}copyAsMarkdown(){if(this.items.length===0)return;const t=this.items.map((e,n)=>`${n+1}. ${e.fullText}`).join(`

`);navigator.clipboard.writeText(t).then(()=>{const e=this.shadowRoot.querySelector(".copy-btn");e&&(e.textContent="✅",setTimeout(()=>{e.textContent="📋"},1500))})}escapeHtml(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}destroy(){var t;(t=this.scrollUnbind)==null||t.call(this),this.hostEl.remove()}}const N={matches:["https://gemini.google.com/*","https://chatgpt.com/*","https://chat.openai.com/*","https://claude.ai/*","https://chat.deepseek.com/*","https://kimi.moonshot.cn/*","https://*.baichuan-ai.com/*","https://yuanbao.tencent.com/*"],runAt:"document_end",main(){console.log("[AI Chat Outline] Content Script injected on",window.location.href);const o=$(window.location.href);let t=null;const e=()=>{const n=o.getUserMessages();n.length>0&&(t||(t=new U(o)),t.updateItems(n))};setTimeout(e,1e3),setTimeout(e,3e3),o.observe(()=>{e()})}},x=((M=(A=globalThis.browser)==null?void 0:A.runtime)==null?void 0:M.id)==null?globalThis.chrome:globalThis.browser;function v(o,...t){}const H={debug:(...o)=>v(console.debug,...o),log:(...o)=>v(console.log,...o),warn:(...o)=>v(console.warn,...o),error:(...o)=>v(console.error,...o)},w=class w extends Event{constructor(t,e){super(w.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=e}};l(w,"EVENT_NAME",S("wxt:locationchange"));let E=w;function S(o){var t;return`${(t=x==null?void 0:x.runtime)==null?void 0:t.id}:content:${o}`}function R(o){let t,e;return{run(){t==null&&(e=new URL(location.href),t=o.setInterval(()=>{let n=new URL(location.href);n.href!==e.href&&(window.dispatchEvent(new E(n,e)),e=n)},1e3))}}}const g=class g{constructor(t,e){l(this,"isTopFrame",window.self===window.top);l(this,"abortController");l(this,"locationWatcher",R(this));l(this,"receivedMessageIds",new Set);this.contentScriptName=t,this.options=e,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(t){return this.abortController.abort(t)}get isInvalid(){return x.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(t){return this.signal.addEventListener("abort",t),()=>this.signal.removeEventListener("abort",t)}block(){return new Promise(()=>{})}setInterval(t,e){const n=setInterval(()=>{this.isValid&&t()},e);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(t,e){const n=setTimeout(()=>{this.isValid&&t()},e);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(t){const e=requestAnimationFrame((...n)=>{this.isValid&&t(...n)});return this.onInvalidated(()=>cancelAnimationFrame(e)),e}requestIdleCallback(t,e){const n=requestIdleCallback((...r)=>{this.signal.aborted||t(...r)},e);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(t,e,n,r){var s;e==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),(s=t.addEventListener)==null||s.call(t,e.startsWith("wxt:")?S(e):e,n,{...r,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),H.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:g.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(t){var s,i,a;const e=((s=t.data)==null?void 0:s.type)===g.SCRIPT_STARTED_MESSAGE_TYPE,n=((i=t.data)==null?void 0:i.contentScriptName)===this.contentScriptName,r=!this.receivedMessageIds.has((a=t.data)==null?void 0:a.messageId);return e&&n&&r}listenForNewerScripts(t){let e=!0;const n=r=>{if(this.verifyScriptStartedEvent(r)){this.receivedMessageIds.add(r.data.messageId);const s=e;if(e=!1,s&&(t!=null&&t.ignoreFirstEvent))return;this.notifyInvalidated()}};addEventListener("message",n),this.onInvalidated(()=>removeEventListener("message",n))}};l(g,"SCRIPT_STARTED_MESSAGE_TYPE",S("wxt:content-script-started"));let I=g;const D=Symbol("null");let F=0;class j extends Map{constructor(...t){super(),this._objectHashes=new WeakMap,this._symbolHashes=new Map,this._publicKeys=new Map;const[e]=t;if(e!=null){if(typeof e[Symbol.iterator]!="function")throw new TypeError(typeof e+" is not iterable (cannot read property Symbol(Symbol.iterator))");for(const[n,r]of e)this.set(n,r)}}_getPublicKeys(t,e=!1){if(!Array.isArray(t))throw new TypeError("The keys parameter must be an array");const n=this._getPrivateKey(t,e);let r;return n&&this._publicKeys.has(n)?r=this._publicKeys.get(n):e&&(r=[...t],this._publicKeys.set(n,r)),{privateKey:n,publicKey:r}}_getPrivateKey(t,e=!1){const n=[];for(const r of t){const s=r===null?D:r;let i;if(typeof s=="object"||typeof s=="function"?i="_objectHashes":typeof s=="symbol"?i="_symbolHashes":i=!1,!i)n.push(s);else if(this[i].has(s))n.push(this[i].get(s));else if(e){const a=`@@mkm-ref-${F++}@@`;this[i].set(s,a),n.push(a)}else return!1}return JSON.stringify(n)}set(t,e){const{publicKey:n}=this._getPublicKeys(t,!0);return super.set(n,e)}get(t){const{publicKey:e}=this._getPublicKeys(t);return super.get(e)}has(t){const{publicKey:e}=this._getPublicKeys(t);return super.has(e)}delete(t){const{publicKey:e,privateKey:n}=this._getPublicKeys(t);return!!(e&&super.delete(e)&&this._publicKeys.delete(n))}clear(){super.clear(),this._symbolHashes.clear(),this._publicKeys.clear()}get[Symbol.toStringTag](){return"ManyKeysMap"}get size(){return super.size}}new j;function O(){}function y(o,...t){}const z={debug:(...o)=>y(console.debug,...o),log:(...o)=>y(console.log,...o),warn:(...o)=>y(console.warn,...o),error:(...o)=>y(console.error,...o)};return(async()=>{try{const{main:o,...t}=N,e=new I("content",t);return await o(e)}catch(o){throw z.error('The content script "content" crashed on startup!',o),o}})()})();
content;
