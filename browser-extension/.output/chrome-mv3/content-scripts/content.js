var content=(function(){"use strict";function A(a){return a}class E{constructor(e=300){this.minSize=e}scanImages(){const e=[];return document.querySelectorAll("img").forEach(t=>{const n=t.getBoundingClientRect(),r=n.width||t.naturalWidth||t.width,o=n.height||t.naturalHeight||t.height;(r>=this.minSize||o>=this.minSize)&&e.push({type:"image",src:t.src,alt:t.alt,title:t.title,width:Math.round(r),height:Math.round(o),element:t})}),e}scanVideos(){const e=[];return document.querySelectorAll("video").forEach(t=>{const n=t.getBoundingClientRect(),r=n.width||t.videoWidth||t.width,o=n.height||t.videoHeight||t.height;if(r>=this.minSize||o>=this.minSize){let d=t.src||t.currentSrc;if(d&&d.startsWith("blob:")){const l=t.querySelectorAll("source");for(const s of l)if(s.src&&!s.src.startsWith("blob:")){d=s.src;break}}e.push({type:"video",src:d,title:t.title,width:Math.round(r),height:Math.round(o),element:t})}}),e}scanBackgroundImages(){const e=[];return document.querySelectorAll("*").forEach(t=>{const r=window.getComputedStyle(t).backgroundImage;if(r&&r!=="none"){const o=r.match(/url\(['"]?([^'"]+)['"]?\)/);if(o&&o[1]){const d=t.getBoundingClientRect(),l=d.width,s=d.height;(l>=this.minSize||s>=this.minSize)&&e.push({type:"image",src:o[1],title:t.getAttribute("title")||void 0,alt:t.getAttribute("alt")||void 0,width:Math.round(l),height:Math.round(s),element:t})}}}),e}getAllMedia(){const e=this.scanImages(),i=this.scanVideos(),t=this.scanBackgroundImages();return[...e,...i,...t].filter((o,d,l)=>d===l.findIndex(s=>s.src===o.src)).sort((o,d)=>d.width*d.height-o.width*o.height)}setMinSize(e){this.minSize=e}}class C{constructor(){this.selectedItems=new Set,this.minWidth=100,this.allMediaItems=[],this.mediaScanner=new E(100),this.overlay=this.createOverlay(),this.attachEventListeners()}async saveSingleMedia(e,i){try{const t=await this.getMediaItemInfo(e);this.showSaveConfirmDialog(t,i)}catch(t){console.error("Get media info failed:",t),this.showNotification("获取文件信息失败","请重试","error")}}async showSaveConfirmDialog(e,i){const t=await this.getSavePath(),n=this.getFileNameFromUrl(e.src),r=document.createElement("div");r.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;const o=document.createElement("div");o.style.cssText=`
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `,o.innerHTML=`
      <h3 style="margin: 0 0 15px 0; color: #333;">确认保存文件</h3>
      <div style="margin-bottom: 15px;">
        <strong>文件名:</strong> ${n}
      </div>
      <div style="margin-bottom: 15px;">
        <label for="aideer-directory-input" style="display: block; margin-bottom: 5px;"><strong>目标路径:</strong></label>
        <input type="text" id="aideer-directory-input" value="${t}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" />
        <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">格式: 项目名/目录路径 (如: mybook/inbox)</small>
      </div>
      <div style="margin-bottom: 15px;">
        <strong>文件尺寸:</strong> ${e.width} × ${e.height}
      </div>
      <div id="aideer-loading-indicator" style="display: none; text-align: center; margin: 15px 0;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="margin-left: 10px;">正在保存...</span>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="aideer-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: pointer;">取消</button>
        <button id="aideer-confirm-btn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">确认保存</button>
      </div>
    `;const d=document.createElement("style");d.textContent=`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,document.head.appendChild(d),r.appendChild(o),document.body.appendChild(r);const l=o.querySelector("#aideer-cancel-btn"),s=o.querySelector("#aideer-confirm-btn"),p=o.querySelector("#aideer-loading-indicator"),c=o.querySelector("#aideer-directory-input");l.addEventListener("click",()=>{document.body.removeChild(r),document.head.removeChild(d)}),s.addEventListener("click",async()=>{try{p.style.display="block",s.disabled=!0,l.disabled=!0,c.disabled=!0,s.textContent="保存中...";const h=c.value.trim();await this.performSaveWithCustomPath(e,i,h),document.body.removeChild(r),document.head.removeChild(d),this.showNotification("保存成功",`文件已保存到 ${h}`,"success")}catch(h){console.error("Save failed:",h),p.style.display="none",s.disabled=!1,l.disabled=!1,c.disabled=!1,s.textContent="确认保存",this.showNotification("保存失败","请检查网络连接和后端服务","error")}}),r.addEventListener("click",h=>{h.target===r&&(document.body.removeChild(r),document.head.removeChild(d))})}async performSaveWithCustomPath(e,i,t){const n=await this.getApiUrl(),r=await this.fetchImageAsBlob(e.src),o=new FormData,d=this.getFileNameFromUrl(e.src),l=t.split("/").filter(p=>p.length>0);if(o.append("file",r,d),o.append("source",i||window.location.href),o.append("width",e.width.toString()),o.append("height",e.height.toString()),l.length>0?o.append("directory",l.join("/")):o.append("directory","inbox"),!(await fetch(`${n}/api/files/import-media-binary`,{method:"POST",body:o})).ok)throw new Error("保存失败")}async performSave(e,i){const t=await this.getApiUrl(),n=await this.fetchImageAsBlob(e.src),r=new FormData,o=this.getFileNameFromUrl(e.src),l=(await this.getSavePath()).split("/").filter(p=>p.length>0);if(r.append("file",n,o),r.append("source",i||window.location.href),r.append("width",e.width.toString()),r.append("height",e.height.toString()),l.length>0?r.append("directory",l.join("/")):r.append("directory","inbox"),!(await fetch(`${t}/api/files/import-media-binary`,{method:"POST",body:r})).ok)throw new Error("保存失败")}async fetchImageAsBlob(e){try{const i=await fetch(e);if(!i.ok)throw new Error(`Failed to fetch image: ${i.statusText}`);return await i.blob()}catch(i){throw console.error("Error fetching image:",i),new Error("无法获取图片数据")}}async getSavePath(){return(await chrome.storage.sync.get(["savePath"])).savePath||"/downloads/images"}getFileNameFromUrl(e){try{const n=new URL(e).pathname.split("/").pop()||"unknown";return n.length>50?n.substring(0,47)+"...":n}catch{return"unknown"}}async getMediaItemInfo(e){return new Promise(i=>{const t=new Image,n=document.createElement("video");/\.(mp4|webm|ogg|avi|mov)(\?.*)?$/i.test(e)?(n.onloadedmetadata=()=>{i({src:e,type:"video",width:n.videoWidth||0,height:n.videoHeight||0,element:n})},n.onerror=()=>{i({src:e,type:"video",width:0,height:0,element:n})},n.src=e):(t.onload=()=>{i({src:e,type:"image",width:t.naturalWidth||0,height:t.naturalHeight||0,element:t})},t.onerror=()=>{i({src:e,type:"image",width:0,height:0,element:t})},t.src=e)})}showNotification(e,i,t){const n=document.createElement("div");n.style.cssText=`
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${t==="success"?"#4CAF50":"#f44336"};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `,n.innerHTML=`
      <div style="font-weight: bold; margin-bottom: 5px;">${e}</div>
      <div>${i}</div>
    `,document.body.appendChild(n),setTimeout(()=>{n.parentNode&&n.parentNode.removeChild(n)},3e3)}createOverlay(){const e=document.getElementById("aideer-media-collector-overlay");e&&e.remove();const i=document.createElement("div");i.id="aideer-media-collector-overlay",i.style.cssText=`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: none;
      overflow-y: auto;
      padding: 20px;
      box-sizing: border-box;
    `;const t=document.createElement("div");t.style.cssText=`
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 20px;
    `;const n=document.createElement("div");n.style.cssText=`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    `;const r=document.createElement("h2");r.textContent="AiDeer Importer",r.style.cssText=`
      margin: 0;
      color: #333;
      font-size: 24px;
    `;const o=document.createElement("div");o.style.cssText=`
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    `;const d=document.createElement("label");d.textContent="最小宽度:",d.style.cssText=`
      font-size: 14px;
      color: #666;
    `;const l=document.createElement("input");l.type="range",l.min="50",l.max="1000",l.value="100",l.style.cssText=`
      width: 150px;
    `;const s=document.createElement("span");s.textContent="100px",s.style.cssText=`
      font-size: 14px;
      color: #333;
      min-width: 50px;
    `,l.addEventListener("input",b=>{const S=b.target.value;s.textContent=`${S}px`,this.minWidth=parseInt(S),this.filterAndRenderMedia()}),o.appendChild(d),o.appendChild(l),o.appendChild(s);const p=document.createElement("div");p.style.cssText=`
      display: flex;
      gap: 10px;
      align-items: center;
    `;const c=document.createElement("button");c.textContent="全选",c.style.cssText=`
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `,c.onclick=()=>this.selectAll();const h=document.createElement("button");h.id="aideer-import-btn",h.textContent="导入选中",h.style.cssText=`
      padding: 8px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `,h.onclick=()=>this.importSelected();const m=document.createElement("button");m.textContent="关闭",m.style.cssText=`
      padding: 8px 16px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `,m.onclick=()=>this.hide(),p.appendChild(c),p.appendChild(h),p.appendChild(m),n.appendChild(r),n.appendChild(o),n.appendChild(p);const g=document.createElement("div");return g.id="aideer-media-grid",g.style.cssText=`
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      max-height: 70vh;
      overflow-y: auto;
    `,t.appendChild(n),t.appendChild(g),i.appendChild(t),i}attachEventListeners(){document.addEventListener("keydown",e=>{e.key==="Escape"&&this.hide()}),this.overlay.addEventListener("click",e=>{e.target===this.overlay&&this.hide()})}show(){document.body.contains(this.overlay)||document.body.appendChild(this.overlay),this.overlay.style.display="block",this.loadMedia()}hide(){this.overlay.style.display="none"}async loadMedia(){const e=this.overlay.querySelector("#aideer-media-grid");e.innerHTML='<div style="text-align: center; padding: 20px;">正在扫描媒体文件...</div>';try{this.allMediaItems=await this.mediaScanner.getAllMedia(),this.filterAndRenderMedia()}catch(i){console.error("Failed to load media:",i),e.innerHTML='<div style="text-align: center; padding: 20px; color: red;">加载媒体文件失败</div>'}}filterAndRenderMedia(){const e=this.allMediaItems.filter(i=>i.width>=this.minWidth);this.renderMediaItems(e)}renderMediaItems(e){const i=this.overlay.querySelector("#aideer-media-grid");if(e.length===0){i.innerHTML='<div style="text-align: center; padding: 20px;">未找到媒体文件</div>';return}i.innerHTML="",e.forEach(t=>{const n=document.createElement("div");n.className="media-item",n.style.cssText=`
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      `;const r=document.createElement("input");r.type="checkbox",r.style.cssText=`
        position: absolute;
        top: 10px;
        right: 10px;
        width: 18px;
        height: 18px;
        cursor: pointer;
      `,r.checked=this.selectedItems.has(t.src),r.addEventListener("change",()=>{r.checked?(this.selectedItems.add(t.src),n.style.borderColor="#007bff",n.style.backgroundColor="#f8f9fa"):(this.selectedItems.delete(t.src),n.style.borderColor="#ddd",n.style.backgroundColor="white")});const o=document.createElement("div");if(o.style.cssText=`
        width: 100%;
        height: 120px;
        background: #f5f5f5;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        overflow: hidden;
      `,t.type==="image"){const s=document.createElement("img");s.src=t.src,s.style.cssText=`
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        `,s.onerror=()=>{o.innerHTML='<span style="color: #666;">图片加载失败</span>'},o.appendChild(s)}else if(t.type==="video"){const s=document.createElement("video");let p=t.src;if(p&&p.startsWith("blob:")){const c=t.element;if(c&&c.src&&!c.src.startsWith("blob:"))p=c.src;else if(c&&c.currentSrc&&!c.currentSrc.startsWith("blob:"))p=c.currentSrc;else{const h=c?.querySelectorAll("source");if(h&&h.length>0){for(const m of h)if(m.src&&!m.src.startsWith("blob:")){p=m.src;break}}}}s.src=p,s.style.cssText=`
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        `,s.controls=!1,s.muted=!0,s.onerror=()=>{o.innerHTML='<span style="color: #666;">视频加载失败</span>'},o.appendChild(s)}const d=document.createElement("div");d.style.cssText=`
        font-size: 12px;
        color: #666;
        line-height: 1.4;
      `;const l=t.src.split("/").pop()||t.src;d.innerHTML=`
        <div style="font-weight: bold; margin-bottom: 4px;">${t.type==="image"?"图片":"视频"}</div>
        <div style="word-break: break-all;">${l}</div>
        ${t.width&&t.height?`<div>${t.width} × ${t.height}</div>`:""}
      `,n.appendChild(r),n.appendChild(o),n.appendChild(d),n.addEventListener("click",s=>{s.target!==r&&r.click()}),i.appendChild(n)})}selectAll(){const e=this.overlay.querySelectorAll('input[type="checkbox"]'),i=Array.from(e).every(t=>t.checked);e.forEach(t=>{i?(t.checked=!1,t.dispatchEvent(new Event("change"))):(t.checked=!0,t.dispatchEvent(new Event("change")))})}async getApiUrl(){return(await chrome.storage.sync.get(["apiUrl"])).apiUrl||"http://localhost:3001"}async importSelected(){if(this.selectedItems.size===0){alert("请先选择要导入的媒体文件");return}const e=this.overlay.querySelector("#aideer-import-btn"),i=e.textContent;e.disabled=!0,e.innerHTML='<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>导入中...';try{const n=(await this.mediaScanner.getAllMedia()).filter(c=>this.selectedItems.has(c.src)),r=await this.getApiUrl(),d=(await this.getSavePath()).split("/").filter(c=>c.length>0),l=d.length>0?d.join("/"):"inbox";let s=0,p=0;for(const c of n)try{const h=new FormData,m=await this.fetchImageAsBlob(c.src),g=this.getFileNameFromUrl(c.src);h.append("file",m,g),h.append("source",window.location.href),h.append("width",c.width.toString()),h.append("height",c.height.toString()),h.append("directory",l);const b=await fetch(`${r}/api/files/import-media-binary`,{method:"POST",body:h});b.ok?s++:(p++,console.error(`Failed to import ${c.src}:`,b.statusText))}catch(h){p++,console.error(`Failed to import ${c.src}:`,h)}s>0?this.showNotification("导入完成",`成功导入 ${s} 个媒体文件${p>0?`，失败 ${p} 个`:""}`,s===n.length?"success":"error"):this.showNotification("导入失败","所有媒体文件导入失败，请检查网络连接和后端服务","error"),this.selectedItems.clear(),this.hide()}catch(t){console.error("Import failed:",t),this.showNotification("导入失败","请检查网络连接和后端服务","error")}finally{e.disabled=!1,e.textContent=i}}}const k={matches:["<all_urls>"],main(){console.log("AiDeer Importer content script loaded");const a=new C;chrome.runtime.onMessage.addListener((e,i,t)=>{e.action==="show-media-collector"?(a.show(),t({success:!0})):e.action==="save-single-media"&&(a.saveSingleMedia(e.mediaUrl,e.pageUrl),t({success:!0}))}),document.addEventListener("keydown",e=>{e.ctrlKey&&e.shiftKey&&e.key==="M"&&(e.preventDefault(),a.show())})}},v=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;function u(a,...e){}const I={debug:(...a)=>u(console.debug,...a),log:(...a)=>u(console.log,...a),warn:(...a)=>u(console.warn,...a),error:(...a)=>u(console.error,...a)};class x extends Event{constructor(e,i){super(x.EVENT_NAME,{}),this.newUrl=e,this.oldUrl=i}static EVENT_NAME=w("wxt:locationchange")}function w(a){return`${v?.runtime?.id}:content:${a}`}function T(a){let e,i;return{run(){e==null&&(i=new URL(location.href),e=a.setInterval(()=>{let t=new URL(location.href);t.href!==i.href&&(window.dispatchEvent(new x(t,i)),i=t)},1e3))}}}class f{constructor(e,i){this.contentScriptName=e,this.options=i,this.abortController=new AbortController,this.isTopFrame?(this.listenForNewerScripts({ignoreFirstEvent:!0}),this.stopOldScripts()):this.listenForNewerScripts()}static SCRIPT_STARTED_MESSAGE_TYPE=w("wxt:content-script-started");isTopFrame=window.self===window.top;abortController;locationWatcher=T(this);receivedMessageIds=new Set;get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return v.runtime.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener("abort",e),()=>this.signal.removeEventListener("abort",e)}block(){return new Promise(()=>{})}setInterval(e,i){const t=setInterval(()=>{this.isValid&&e()},i);return this.onInvalidated(()=>clearInterval(t)),t}setTimeout(e,i){const t=setTimeout(()=>{this.isValid&&e()},i);return this.onInvalidated(()=>clearTimeout(t)),t}requestAnimationFrame(e){const i=requestAnimationFrame((...t)=>{this.isValid&&e(...t)});return this.onInvalidated(()=>cancelAnimationFrame(i)),i}requestIdleCallback(e,i){const t=requestIdleCallback((...n)=>{this.signal.aborted||e(...n)},i);return this.onInvalidated(()=>cancelIdleCallback(t)),t}addEventListener(e,i,t,n){i==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(i.startsWith("wxt:")?w(i):i,t,{...n,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),I.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){window.postMessage({type:f.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:Math.random().toString(36).slice(2)},"*")}verifyScriptStartedEvent(e){const i=e.data?.type===f.SCRIPT_STARTED_MESSAGE_TYPE,t=e.data?.contentScriptName===this.contentScriptName,n=!this.receivedMessageIds.has(e.data?.messageId);return i&&t&&n}listenForNewerScripts(e){let i=!0;const t=n=>{if(this.verifyScriptStartedEvent(n)){this.receivedMessageIds.add(n.data.messageId);const r=i;if(i=!1,r&&e?.ignoreFirstEvent)return;this.notifyInvalidated()}};addEventListener("message",t),this.onInvalidated(()=>removeEventListener("message",t))}}function L(){}function y(a,...e){}const M={debug:(...a)=>y(console.debug,...a),log:(...a)=>y(console.log,...a),warn:(...a)=>y(console.warn,...a),error:(...a)=>y(console.error,...a)};return(async()=>{try{const{main:a,...e}=k,i=new f("content",e);return await a(i)}catch(a){throw M.error('The content script "content" crashed on startup!',a),a}})()})();
content;