let o=!1;const i=(n,r,c)=>{self.postMessage({type:n,payload:r,id:c})},y=n=>i("log",n),m=n=>i("error",String(n?.stack??n?.message??n)),d=()=>i("done");self.onmessage=async n=>{const r=n.data;if(r.type==="cancel"){o=!0;return}if(r.type!=="run")return;const c=String(r.payload??"");o=!1;const a={log:(...s)=>{const t=s.map(e=>{if(e==null)return"null/undefined";if(typeof e=="string")return e;try{return JSON.stringify(e)}catch{return String(e)}}).join(" ")+`
`;y(t)}},l=s=>new Promise(t=>{if(o)return t("");const e=Math.random().toString(36).slice(2),p=g=>{const u=g.data;u?.type==="inputResponse"&&u.id===e&&(self.removeEventListener("message",p),t(u.payload??""))};self.addEventListener("message",p),i("inputRequest",s??null,e)}),f=()=>{const s=`
      "use strict";
      return (async (input, console) => {
        ${c}
      })(input, console);
    `;return new Function("input","console",s)(l,a)};try{await f(),o||d()}catch{const t=`
      "use strict";
      return (async (input, console) => {
        try {
          ${c}
        } catch (e) {
          console.log("Runtime error: " + (e?.message || String(e)));
        }
      })(input, console);
    `;try{await new Function("input","console",t)(l,a),o||d()}catch(e){m(e)}}};
