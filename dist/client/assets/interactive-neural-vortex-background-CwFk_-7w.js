import{c as g,r as u,j as t,m as b,v as k}from"./index-DSASgbW2.js";const F=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],X=g("eye-off",F);const C=[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]],G=g("eye",C);const T=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],D=g("zap",T),B=u.forwardRef(({label:r,error:i,className:d,id:s,trailing:o,...m},c)=>{const l=s??r.toLowerCase().replace(/\s+/g,"-");return t.jsxs("div",{className:"space-y-1.5",children:[t.jsx("label",{htmlFor:l,className:"text-sm font-medium text-[#1e3a5f]/90",children:r}),t.jsxs("div",{className:"relative",children:[t.jsx("input",{ref:c,id:l,className:b("h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-foreground outline-none transition-all","placeholder:text-muted-foreground/60","focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/15",i&&"border-destructive/70 focus:border-destructive focus:ring-destructive/15",o&&"pr-11",d),...m}),o?t.jsx("div",{className:"absolute inset-y-0 right-1.5 flex items-center",children:o}):null]}),i?t.jsx("p",{className:"text-xs text-destructive",children:i}):null]})});B.displayName="AuthField";const I=[{label:"Name",value:"98%"},{label:"Email",value:"94%"},{label:"Phone",value:"96%"}];function V(){return t.jsxs("div",{className:"w-full max-w-lg min-w-0 px-2 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10",children:[t.jsxs("div",{className:"mb-8 text-center sm:text-left",children:[t.jsxs("h2",{className:"font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl",children:["Turn business cards",t.jsx("span",{className:"block bg-gradient-to-r from-cyan-300 via-violet-300 to-violet-400 bg-clip-text text-transparent",children:"into CRM leads"})]}),t.jsx("p",{className:"mt-3 max-w-sm text-sm leading-relaxed text-white/60",children:"Scan at events, review on-device, and sync to the database — built for networking teams."})]}),t.jsxs("div",{className:"",children:[t.jsxs("div",{className:"mb-3 flex items-center gap-2 text-xs text-white/70",children:[t.jsx(k,{className:"h-3.5 w-3.5 text-cyan-300"}),t.jsx("span",{children:"Live scanning preview"})]}),t.jsxs("div",{className:"relative aspect-[1.6/1] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0f172a]",children:[["top-2 left-2 border-l-2 border-t-2","top-2 right-2 border-r-2 border-t-2","bottom-2 left-2 border-l-2 border-b-2","bottom-2 right-2 border-r-2 border-b-2"].map(r=>t.jsx("div",{className:b("absolute h-4 w-4 border-cyan-400/80",r)},r)),t.jsx("div",{className:"pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden",children:t.jsx("div",{className:"animate-scan-line absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent"})})]}),t.jsx("div",{className:"mt-3 grid grid-cols-3 gap-2",children:I.map(r=>t.jsxs("div",{className:"rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center",children:[t.jsx("div",{className:"text-sm font-semibold text-white",children:r.value}),t.jsx("div",{className:"text-[10px] text-white/50",children:r.label})]},r.label))})]}),t.jsx("div",{className:"mt-6 flex flex-wrap justify-center gap-2 sm:justify-start",children:["On-device OCR","Database sync","Offline queue"].map(r=>t.jsxs("span",{className:"inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/65",children:[t.jsx(D,{className:"h-3 w-3 text-violet-300"}),r]},r))})]})}const O=`
  precision mediump float;
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`,H=`
  precision mediump float;
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_ratio;
  uniform vec2 u_pointer_position;
  uniform float u_scroll_progress;

  vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  float neuro_shape(vec2 uv, float t, float p) {
    vec2 sine_acc = vec2(0.);
    vec2 res = vec2(0.);
    float scale = 8.;
    for (int j = 0; j < 15; j++) {
      uv = rotate(uv, 1.);
      sine_acc = rotate(sine_acc, 1.);
      vec2 layer = uv * scale + float(j) + sine_acc - t;
      sine_acc += sin(layer) + 2.4 * p;
      res += (.5 + .5 * cos(layer)) / scale;
      scale *= 1.2;
    }
    return res.x + res.y;
  }

  void main() {
    vec2 uv = .5 * vUv;
    uv.x *= u_ratio;
    vec2 pointer = vUv - u_pointer_position;
    pointer.x *= u_ratio;
    float p = clamp(length(pointer), 0., 1.);
    p = .5 * pow(1. - p, 2.);
    float t = .001 * u_time;
    float noise = neuro_shape(uv, t, p);
    noise = 1.15 * pow(noise, 2.8);
    noise += pow(noise, 8.) * 0.85;
    noise = max(.0, noise - .42);
    noise *= (1. - length(vUv - .5) * 0.85);

    // Dark base + CardSync cyan + two violet glows
    vec3 baseDark = vec3(0.03, 0.05, 0.12);
    vec3 violet = vec3(0.62, 0.28, 0.95);
    vec3 violetDeep = vec3(0.38, 0.12, 0.72);
    vec3 cyan = vec3(0.10, 0.58, 0.88);

    vec3 glow = mix(violetDeep, mix(violet, cyan, 0.42 + 0.2 * sin(2.0 * u_scroll_progress + 1.2)), noise);
    glow += violet * (0.15 + 0.08 * sin(2.0 * u_scroll_progress + 1.5));
    vec3 color = baseDark + glow * noise * 1.65;

    float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.65;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;function A(r,i,d){const s=r.createShader(d);return s?(r.shaderSource(s,i),r.compileShader(s),r.getShaderParameter(s,r.COMPILE_STATUS)?s:(console.error("Shader error:",r.getShaderInfoLog(s)),r.deleteShader(s),null)):null}function W({className:r,contained:i=!0}){const d=u.useRef(null),s=u.useRef(null),o=u.useRef({x:0,y:0,tX:0,tY:0}),m=u.useRef(0);return u.useEffect(()=>{const c=s.current,l=d.current;if(!c||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const e=c.getContext("webgl")??c.getContext("experimental-webgl");if(!e||!(e instanceof WebGLRenderingContext)){console.error("WebGL not supported");return}const f=A(e,O,e.VERTEX_SHADER),h=A(e,H,e.FRAGMENT_SHADER);if(!f||!h)return;const n=e.createProgram();if(!n)return;if(e.attachShader(n,f),e.attachShader(n,h),e.linkProgram(n),!e.getProgramParameter(n,e.LINK_STATUS)){console.error("Program link error:",e.getProgramInfoLog(n));return}e.useProgram(n);const S=new Float32Array([-1,-1,1,-1,-1,1,1,1]),E=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,E),e.bufferData(e.ARRAY_BUFFER,S,e.STATIC_DRAW);const w=e.getAttribLocation(n,"a_position");e.enableVertexAttribArray(w),e.vertexAttribPointer(w,2,e.FLOAT,!1,0,0);const L=e.getUniformLocation(n,"u_time"),P=e.getUniformLocation(n,"u_ratio"),M=e.getUniformLocation(n,"u_pointer_position"),U=e.getUniformLocation(n,"u_scroll_progress");e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA);const _=()=>i&&l?l.getBoundingClientRect():{width:window.innerWidth,height:window.innerHeight,left:0,top:0},v=()=>{const a=_(),j=Math.min(window.devicePixelRatio||1,2),p=Math.max(1,Math.floor(a.width*j)),x=Math.max(1,Math.floor(a.height*j));c.width=p,c.height=x,c.style.width=`${a.width}px`,c.style.height=`${a.height}px`,e.viewport(0,0,p,x),e.uniform1f(P,p/x)};v();const y=()=>{const a=_();o.current.x+=(o.current.tX-o.current.x)*.2,o.current.y+=(o.current.tY-o.current.y)*.2,e.uniform1f(L,performance.now()),e.uniform2f(M,(o.current.x-a.left)/a.width,1-(o.current.y-a.top)/a.height),e.uniform1f(U,window.pageYOffset/(2*window.innerHeight)),e.clearColor(.03,.05,.12,1),e.clear(e.COLOR_BUFFER_BIT),e.drawArrays(e.TRIANGLE_STRIP,0,4),m.current=requestAnimationFrame(y)};y();const N=a=>{o.current.tX=a.clientX,o.current.tY=a.clientY};window.addEventListener("resize",v),window.addEventListener("pointermove",N);const R=i&&l?new ResizeObserver(v):null;return R?.observe(l),()=>{window.removeEventListener("resize",v),window.removeEventListener("pointermove",N),R?.disconnect(),cancelAnimationFrame(m.current),e.deleteProgram(n),e.deleteShader(f),e.deleteShader(h)}},[i]),t.jsx("div",{ref:d,className:b("absolute inset-0 overflow-hidden bg-[#070b14]",r),children:t.jsx("canvas",{ref:s,className:"pointer-events-none absolute inset-0 h-full w-full","aria-hidden":!0})})}export{V as A,X as E,W as N,B as a,G as b};
