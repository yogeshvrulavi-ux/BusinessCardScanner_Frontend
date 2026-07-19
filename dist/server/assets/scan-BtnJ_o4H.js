import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useNavigate, Link } from "@tanstack/react-router";
import { useRef, useState, useEffect, useCallback, Suspense, lazy } from "react";
import { Sparkles, X, CheckCircle2, Loader2, ScanLine, Upload, FileImage, Camera } from "lucide-react";
import { P as PageShell, C as Card } from "./PageShell-DPWj-4WK.js";
import { p as getConnectionMode, q as useUserSettings, C as CONNECTION_MODE_CHANGED, P as PAGE, B as Button, r as getCachedContacts, g as getQueueItems, l as listContacts, t as cacheContacts, j as loadUserSettings } from "./router-CTqOT-Nn.js";
import { r as readFileAsDataUrl, i as isValidCardImage } from "./scanSession-HtX0cjGm.js";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
import "idb";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-alert-dialog";
import "zod";
const CameraCapture = lazy(
  () => import("./CameraCapture-BL_qZQwS.js").then((m) => ({ default: m.CameraCapture }))
);
function ScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const captureSourceRef = useRef("Upload");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [recentContacts, setRecentContacts] = useState([]);
  const [connectionMode, setConnectionMode] = useState(
    () => typeof window !== "undefined" ? getConnectionMode() : "online"
  );
  const { firstName, settings } = useUserSettings();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshMode = () => setConnectionMode(getConnectionMode());
    window.addEventListener("online", refreshMode);
    window.addEventListener("offline", refreshMode);
    window.addEventListener(CONNECTION_MODE_CHANGED, refreshMode);
    return () => {
      window.removeEventListener("online", refreshMode);
      window.removeEventListener("offline", refreshMode);
      window.removeEventListener(CONNECTION_MODE_CHANGED, refreshMode);
    };
  }, []);
  const formatRecentList = useCallback((contactsData, queueItems) => {
    const accents = [
      "from-indigo-500 to-violet-500",
      "from-sky-500 to-indigo-500",
      "from-emerald-500 to-teal-500",
      "from-amber-500 to-orange-500",
      "from-fuchsia-500 to-pink-500",
      "from-cyan-500 to-blue-500"
    ];
    const queuedContacts = queueItems.map((item) => ({
      ...item.contact_data,
      id: item.id,
      accent: "from-amber-500 to-orange-500",
      lastSync: item.status === "failed" ? "Sync failed" : "Pending sync"
    }));
    const merged = [...queuedContacts, ...contactsData];
    const visible = merged.filter((c) => {
      const name = typeof c.name === "string" ? c.name.trim() : "";
      return name !== "Vikram Merita";
    });
    return visible.map((c, i) => ({
      ...c,
      accent: c.accent || accents[i % accents.length],
      lastSync: c.lastSync || "Just now"
    }));
  }, []);
  useEffect(() => {
    let cancelled = false;
    const fetchRecent = async () => {
      let contactsData = [];
      try {
        const cached = await getCachedContacts();
        if (!cancelled && cached.length > 0) {
          const queueItems = await getQueueItems();
          setRecentContacts(formatRecentList(cached, queueItems));
        }
      } catch {
      }
      try {
        contactsData = await listContacts();
        if (contactsData.length > 0) {
          await cacheContacts(contactsData);
        }
      } catch {
        contactsData = await getCachedContacts();
      }
      if (contactsData.length === 0) {
        try {
          contactsData = await getCachedContacts();
        } catch {
          contactsData = [];
        }
      }
      try {
        const queueItems = await getQueueItems();
        if (!cancelled) {
          setRecentContacts(formatRecentList(contactsData, queueItems));
        }
      } catch (e) {
        console.error("Failed to fetch recent scans from IndexedDB:", e);
      }
    };
    void fetchRecent();
    return () => {
      cancelled = true;
    };
  }, [connectionMode, formatRecentList]);
  const tips = [
    "Place cards on a flat, high-contrast background for best results.",
    "Crop out extra background elements to speed up AI processing.",
    "Captured contacts are queued locally and automatically synced when online.",
    "Skewed card? The engine automatically detects and straightens card text!"
  ];
  const rotateTip = () => {
    setTipIndex((prev) => (prev + 1) % tips.length);
  };
  const getGreeting = () => {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    if (hour < 12) return { text: "Good morning" };
    if (hour < 17) return { text: "Good afternoon" };
    if (hour < 22) return { text: "Good evening" };
    return { text: "Good night" };
  };
  const { text: greetingText } = getGreeting();
  const dateStr = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
  const processFile = (selectedFile) => {
    setError(null);
    setIsComplete(false);
    setProgress(0);
    if (!isValidCardImage(selectedFile)) {
      setError("Please upload a valid JPG or PNG image.");
      return false;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return false;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result);
    reader.readAsDataURL(selectedFile);
    return true;
  };
  const handleUploadFromFolder = async (selectedFile) => {
    if (!processFile(selectedFile)) return;
    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      captureSourceRef.current = "Upload";
      await runScanPipeline(selectedFile, dataUrl, true);
    } catch (err) {
      console.error(err);
      setError("Failed to read the selected image.");
    }
  };
  const handleCameraCapture = async (capturedFile) => {
    setCameraOpen(false);
    if (!processFile(capturedFile)) return;
    try {
      const dataUrl = await readFileAsDataUrl(capturedFile);
      captureSourceRef.current = "Camera";
      await runScanPipeline(capturedFile, dataUrl, true);
    } catch (err) {
      console.error(err);
      setError("Failed to process camera capture.");
    }
  };
  const runScanPipeline = async (activeFile, activePreview, autoNavigate) => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    const progressTimer = window.setInterval(() => {
      setProgress((prev) => prev >= 90 ? prev : prev + Math.floor(Math.random() * 6 + 3));
    }, 350);
    try {
      const prefs = loadUserSettings();
      const captureToasts = prefs.notificationsEnabled && prefs.captureNotificationsEnabled;
      if (captureToasts) {
        toast.info("Extracting contact details from card…");
      }
      const { scanFileAndStore } = await import("./scanPipeline-aUHV85eM.js").then((n) => n.a);
      await scanFileAndStore(
        activeFile,
        activePreview,
        ({ progress: progress2, message }) => {
          setProgress(Math.max(10, progress2));
          if (progress2 >= 100 && captureToasts) toast.success(message);
        },
        captureSourceRef.current
      );
      finishProcessing(autoNavigate);
    } catch (err) {
      console.error("Scan pipeline failed:", err);
      toast.error("Scan failed. You can edit details on the review screen.");
      finishProcessing(autoNavigate);
      setError("Could not extract text automatically.");
    } finally {
      window.clearInterval(progressTimer);
      setProgress(100);
    }
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleUploadFromFolder(dropped);
  };
  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setProgress(0);
    setError(null);
    setIsComplete(false);
    sessionStorage.removeItem("latestScanImage");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const finishProcessing = (autoNavigate) => {
    setIsProcessing(false);
    setIsComplete(true);
    if (autoNavigate) {
      sessionStorage.setItem("cs-scan-ts", String(Date.now()));
      window.dispatchEvent(new CustomEvent("cs-scan-updated"));
      navigate({ to: "/review" });
    }
  };
  const handleProcess = async () => {
    if (!file || !preview) return;
    await runScanPipeline(file, preview, false);
  };
  return /* @__PURE__ */ jsxs(PageShell, { title: PAGE.capture.title, description: PAGE.capture.description, children: [
    /* @__PURE__ */ jsx("div", { className: "relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl shadow-soft", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: [
          greetingText,
          ", ",
          /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent", children: firstName })
        ] }) }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: dateStr })
      ] }),
      settings.showCaptureTips ? /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex flex-1 max-w-xl cursor-pointer select-none items-center justify-between gap-3 rounded-md border border-border/40 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40",
          onClick: rotateTip,
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 shrink-0 animate-pulse text-primary" }),
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground/90 transition-all duration-300", children: tips[tipIndex] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "ml-2 shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline", children: "Next tip" })
          ]
        }
      ) : null
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-3 flex flex-col", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "file",
            ref: fileInputRef,
            onChange: (e) => {
              const picked = e.target.files?.[0];
              if (picked) handleUploadFromFolder(picked);
              e.target.value = "";
            },
            accept: "image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png",
            className: "hidden"
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            className: `flex-1 rounded-2xl border-2 border-dashed p-8 text-center transition-all md:p-12 flex flex-col items-center justify-center ${isDragging ? "border-primary bg-primary/5" : preview ? "border-border bg-card" : "border-border bg-muted/30 hover:border-primary/40 hover:bg-accent/40"}`,
            children: preview ? /* @__PURE__ */ jsxs("div", { className: "w-full h-full flex flex-col items-center justify-center fade-in", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-[240px] rounded-xl overflow-hidden shadow-soft mb-4 border border-border/60", children: [
                /* @__PURE__ */ jsx("img", { src: preview, alt: "Card preview", className: "w-full h-auto max-h-[160px] object-cover" }),
                !isProcessing && !isComplete && /* @__PURE__ */ jsx("div", { className: "absolute top-2 right-2", children: /* @__PURE__ */ jsx(Button, { variant: "secondary", size: "icon", className: "h-7 w-7 rounded-full bg-background/80 hover:bg-background backdrop-blur shadow-soft text-foreground", onClick: clearFile, children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) }) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: file?.name }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                (file?.size / (1024 * 1024)).toFixed(2),
                " MB"
              ] }),
              error && /* @__PURE__ */ jsx("div", { className: "mt-3 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-lg", children: error }),
              isComplete ? /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xs mt-6 space-y-3 text-center fade-in", children: [
                /* @__PURE__ */ jsx("div", { className: "mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-5 w-5" }) }),
                /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-success", children: "Successfully processed" }),
                /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 mt-4", children: [
                  /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full rounded-xl bg-gradient-primary shadow-glow", children: /* @__PURE__ */ jsx(Link, { to: "/review", children: "Review & Save Contact" }) }),
                  /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full rounded-xl", onClick: clearFile, children: "Scan another card" })
                ] })
              ] }) : isProcessing ? /* @__PURE__ */ jsxs("div", { className: "w-full max-w-xs mt-6 space-y-2 fade-in", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-xs font-medium", children: [
                  /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                    /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin text-primary" }),
                    " Processing..."
                  ] }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    progress,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-1.5 w-full bg-muted overflow-hidden rounded-full", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-primary transition-all duration-300", style: { width: `${progress}%` } }) })
              ] }) : /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap justify-center gap-2 w-full fade-in", children: /* @__PURE__ */ jsxs(Button, { onClick: () => handleProcess(), className: "w-full sm:w-auto rounded-xl bg-gradient-primary shadow-glow", children: [
                /* @__PURE__ */ jsx(ScanLine, { className: "mr-2 h-4 w-4" }),
                " Process card"
              ] }) })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "fade-in flex flex-col items-center", children: [
              /* @__PURE__ */ jsx("div", { className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow pointer-events-none", children: /* @__PURE__ */ jsx(Upload, { className: "h-6 w-6" }) }),
              /* @__PURE__ */ jsx("h3", { className: "mt-5 text-lg font-semibold tracking-tight pointer-events-none", children: "Drop a business card here" }),
              /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground pointer-events-none", children: "PNG, JPG or JPEG up to 10MB." }),
              error && /* @__PURE__ */ jsx("div", { className: "mt-4 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-lg", children: error }),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 w-full", children: [
                /* @__PURE__ */ jsxs(Button, { onClick: () => fileInputRef.current?.click(), className: "w-full sm:w-auto rounded-xl bg-gradient-primary shadow-glow", children: [
                  /* @__PURE__ */ jsx(FileImage, { className: "mr-2 h-4 w-4" }),
                  " Choose from folder"
                ] }),
                /* @__PURE__ */ jsxs(Button, { variant: "outline", onClick: () => setCameraOpen(true), className: "w-full sm:w-auto rounded-xl", children: [
                  /* @__PURE__ */ jsx(Camera, { className: "mr-2 h-4 w-4" }),
                  " Use camera"
                ] })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "mt-5 flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
          "AI extracts contact details automatically · powered by on-device OCR"
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Card, { className: "relative overflow-hidden rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2 flex flex-col", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Live preview" }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: isComplete ? "Extraction complete" : isProcessing ? "Scanning..." : preview ? "Ready to scan" : "Awaiting image..." }),
        /* @__PURE__ */ jsxs("div", { className: "relative mt-4 aspect-[1.6/1] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 shadow-elevated", children: [
          preview ? /* @__PURE__ */ jsx("img", { src: preview, alt: "Scanning preview", className: `absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isProcessing ? "opacity-50" : "opacity-80"}` }) : /* @__PURE__ */ jsx(Fragment, {}),
          ["top-2 left-2 border-l-2 border-t-2", "top-2 right-2 border-r-2 border-t-2", "bottom-2 left-2 border-l-2 border-b-2", "bottom-2 right-2 border-r-2 border-b-2"].map((p) => /* @__PURE__ */ jsx("div", { className: `absolute h-5 w-5 rounded-sm border-primary transition-colors ${isComplete ? "border-success" : ""} ${p}` }, p)),
          /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: `absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-primary/40 to-transparent shadow-glow ${isProcessing || !preview && !isComplete ? "animate-scan-line" : "hidden"}` }) }),
          isComplete && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success", children: /* @__PURE__ */ jsx(CheckCircle2, { className: "h-6 w-6" }) }),
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium text-white", children: "Extracted" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2 text-center text-[11px]", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/40 p-2 transition-colors duration-300", style: { backgroundColor: isComplete ? "hsl(var(--success)/0.1)" : "" }, children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: isComplete ? "99%" : isProcessing ? "..." : "98%" }),
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Name" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/40 p-2 transition-colors duration-300", style: { backgroundColor: isComplete ? "hsl(var(--success)/0.1)" : "" }, children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: isComplete ? "98%" : isProcessing ? "..." : "94%" }),
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Email" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-muted/40 p-2 transition-colors duration-300", style: { backgroundColor: isComplete ? "hsl(var(--success)/0.1)" : "" }, children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: isComplete ? "97%" : isProcessing ? "..." : "96%" }),
            /* @__PURE__ */ jsx("div", { className: "text-muted-foreground", children: "Phone" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-auto pt-4", children: isComplete ? /* @__PURE__ */ jsx(Button, { asChild: true, className: "w-full rounded-xl bg-gradient-primary shadow-glow", children: /* @__PURE__ */ jsxs(Link, { to: "/review", children: [
          /* @__PURE__ */ jsx(ScanLine, { className: "mr-2 h-4 w-4" }),
          " Review extracted details"
        ] }) }) : /* @__PURE__ */ jsxs(Button, { disabled: true, className: "w-full rounded-xl bg-gradient-primary shadow-glow", children: [
          /* @__PURE__ */ jsx(ScanLine, { className: "mr-2 h-4 w-4" }),
          " Review extracted details"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { className: "rounded-2xl border-border/60 p-5 shadow-soft", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Recent scans" }),
        /* @__PURE__ */ jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "rounded-lg text-xs", children: /* @__PURE__ */ jsx(Link, { to: "/contacts", children: "View all" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar", children: [
        recentContacts.slice(0, 8).map((c) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "min-w-[240px] sm:min-w-[200px] shrink-0 snap-center rounded-2xl border border-border/60 bg-card p-3 shadow-soft transition-transform hover:-translate-y-0.5",
            children: [
              /* @__PURE__ */ jsx("div", { className: `flex aspect-[1.6/1] items-end overflow-hidden rounded-xl bg-gradient-to-br ${c.accent} p-3`, children: /* @__PURE__ */ jsxs("div", { className: "text-white", children: [
                /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold", children: c.name }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] opacity-80", children: c.company })
              ] }) }),
              /* @__PURE__ */ jsx("div", { className: "mt-2 text-[11px] text-muted-foreground", children: c.lastSync })
            ]
          },
          c.id
        )),
        recentContacts.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground italic py-4 pl-1", children: "No recent scans found." })
      ] })
    ] }),
    cameraOpen && /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(
      CameraCapture,
      {
        open: cameraOpen,
        onClose: () => setCameraOpen(false),
        onCapture: handleCameraCapture
      }
    ) })
  ] });
}
const SplitComponent = ScanPage;
export {
  SplitComponent as component
};
