import { jsxs, jsx } from "react/jsx-runtime";
import { forwardRef, useRef, useEffect } from "react";
import { h as cn } from "./router-gDbAJgHl.js";
import { ScanLine, Zap } from "lucide-react";
const AuthField = forwardRef(
  ({ label, error, className, id, trailing, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "text-sm font-medium text-[#1e3a5f]/90", children: label }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            ref,
            id: inputId,
            className: cn(
              "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-foreground outline-none transition-all",
              "placeholder:text-muted-foreground/60",
              "focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/15",
              error && "border-destructive/70 focus:border-destructive focus:ring-destructive/15",
              trailing && "pr-11",
              className
            ),
            ...props
          }
        ),
        trailing ? /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 right-1.5 flex items-center", children: trailing }) : null
      ] }),
      error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: error }) : null
    ] });
  }
);
AuthField.displayName = "AuthField";
const stats = [
  { label: "Name", value: "98%" },
  { label: "Email", value: "94%" },
  { label: "Phone", value: "96%" }
];
function AuthScannerPanel() {
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg min-w-0 px-2 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center sm:text-left", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl", children: [
        "Turn business cards",
        /* @__PURE__ */ jsx("span", { className: "block bg-gradient-to-r from-cyan-300 via-violet-300 to-violet-400 bg-clip-text text-transparent", children: "into CRM leads" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-sm text-sm leading-relaxed text-white/60", children: "Scan at events, review on-device, and sync to the database — built for networking teams." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 text-xs text-white/70", children: [
        /* @__PURE__ */ jsx(ScanLine, { className: "h-3.5 w-3.5 text-cyan-300" }),
        /* @__PURE__ */ jsx("span", { children: "Live scanning preview" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative aspect-[1.6/1] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0f172a]", children: [
        [
          "top-2 left-2 border-l-2 border-t-2",
          "top-2 right-2 border-r-2 border-t-2",
          "bottom-2 left-2 border-l-2 border-b-2",
          "bottom-2 right-2 border-r-2 border-b-2"
        ].map((position) => /* @__PURE__ */ jsx("div", { className: cn("absolute h-4 w-4 border-cyan-400/80", position) }, position)),
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "animate-scan-line absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-3 gap-2", children: stats.map((stat) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-white", children: stat.value }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-white/50", children: stat.label })
          ]
        },
        stat.label
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap justify-center gap-2 sm:justify-start", children: ["On-device OCR", "Database sync", "Offline queue"].map((feature) => /* @__PURE__ */ jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/65",
        children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 text-violet-300" }),
          feature
        ]
      },
      feature
    )) })
  ] });
}
const VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;
const FRAGMENT_SHADER = `
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
`;
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function NeuralVortexBackground({ className, contained = true }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
  const animationRef = useRef(0);
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const rootEl = rootRef.current;
    if (!canvasEl) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const gl = canvasEl.getContext("webgl") ?? canvasEl.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      console.error("WebGL not supported");
      return;
    }
    const vertexShader = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRatio = gl.getUniformLocation(program, "u_ratio");
    const uPointerPosition = gl.getUniformLocation(program, "u_pointer_position");
    const uScrollProgress = gl.getUniformLocation(program, "u_scroll_progress");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const getBounds = () => {
      if (contained && rootEl) {
        return rootEl.getBoundingClientRect();
      }
      return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
    };
    const resizeCanvas = () => {
      const bounds = getBounds();
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(bounds.width * devicePixelRatio));
      const height = Math.max(1, Math.floor(bounds.height * devicePixelRatio));
      canvasEl.width = width;
      canvasEl.height = height;
      canvasEl.style.width = `${bounds.width}px`;
      canvasEl.style.height = `${bounds.height}px`;
      gl.viewport(0, 0, width, height);
      gl.uniform1f(uRatio, width / height);
    };
    resizeCanvas();
    const render = () => {
      const bounds = getBounds();
      pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
      pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;
      gl.uniform1f(uTime, performance.now());
      gl.uniform2f(
        uPointerPosition,
        (pointer.current.x - bounds.left) / bounds.width,
        1 - (pointer.current.y - bounds.top) / bounds.height
      );
      gl.uniform1f(uScrollProgress, window.pageYOffset / (2 * window.innerHeight));
      gl.clearColor(0.03, 0.05, 0.12, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    const handlePointerMove = (e) => {
      pointer.current.tX = e.clientX;
      pointer.current.tY = e.clientY;
    };
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    const observer = contained && rootEl ? new ResizeObserver(resizeCanvas) : null;
    observer?.observe(rootEl);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      observer?.disconnect();
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [contained]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: rootRef,
      className: cn("absolute inset-0 overflow-hidden bg-[#070b14]", className),
      children: /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: "pointer-events-none absolute inset-0 h-full w-full", "aria-hidden": true })
    }
  );
}
export {
  AuthScannerPanel as A,
  NeuralVortexBackground as N,
  AuthField as a
};
