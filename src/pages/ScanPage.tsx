import { Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useState, useRef, DragEvent, useMemo } from "react";
import { Camera, Upload, ScanLine, Sparkles, FileImage, X, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { StorageWarningBanner } from "@/components/subscription/StorageWarningBanner";
import { UpgradePlanDialog } from "@/components/subscription/UpgradePlanDialog";
import { CardImageCell } from "@/components/contacts/CardImageCell";
import { ImageOptimizationStats } from "@/components/preview/ImagePreview";
import { PAGE } from "@/constants/navigation";
import { useStorageQuota } from "@/contexts/StorageQuotaContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useContactsDirectory } from "@/hooks/useContactsDirectory";
import { useAuth } from "@/lib/AuthContext";
import { loadUserSettings } from "@/lib/settingsStorage";
import { isValidCardImage, readFileAsDataUrl } from "@/lib/scanSession";
import { isFreemiumExpired } from "@/lib/subscriptionPlans";
import { isMobileNumberVerified } from "@/lib/wipeAllData";
import { toast } from "sonner";

const CameraCapture = lazy(() =>
  import("@/components/camera/CameraCapture").then((m) => ({ default: m.CameraCapture })),
);

const REMOVED_RECENT_SCANS_KEY = "cs-removed-recent-scans";
const RECENT_SCANS_LIMIT = 5;

function contactRecencyMs(createdAt?: string): number {
  if (!createdAt) return 0;
  const ms = Date.parse(createdAt);
  return Number.isFinite(ms) ? ms : 0;
}

export function ScanPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureSourceRef = useRef<string>("Upload");
  const { quota, isBlocked } = useStorageQuota();
  const { user: authUser } = useAuth();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageStats, setImageStats] = useState<{
    originalBytes: number;
    optimizedBytes: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const guardCapture = (): boolean => {
    if (isFreemiumExpired(quota)) {
      const phone = loadUserSettings().phone || "";
      if (!isMobileNumberVerified(authUser?.id, phone)) {
        toast.error("Verify your mobile number in Settings to continue after Freemium expiry.");
        void navigate({ to: "/settings" });
        return false;
      }
    }
    if (!isBlocked) return true;
    setUpgradeOpen(true);
    toast.error("Storage limit reached. Upgrade your subscription to continue scanning.");
    return false;
  };
  // Same role-scoped directory as Contacts (USER / ADMIN / SUPER_ADMIN).
  const { contacts: directoryContacts } = useContactsDirectory();
  const [removedRecentIds, setRemovedRecentIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(REMOVED_RECENT_SCANS_KEY) || "[]");
      return new Set(Array.isArray(saved) ? saved.map(String) : []);
    } catch {
      return new Set();
    }
  });
  const { firstName, settings } = useUserSettings();

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
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning",  };
    if (hour < 17) return { text: "Good afternoon" };
    if (hour < 22) return { text: "Good evening"};
    return { text: "Good night" };
  };

  const { text: greetingText } = getGreeting();

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const processFile = (selectedFile: File) => {
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
    setImageStats(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
    return true;
  };

  /** Shared optimize step for folder upload and camera (same pipeline / target size). */
  const prepareOptimizedImage = async (
    selectedFile: File,
    dataUrl: string,
    source: "Upload" | "Camera",
  ) => {
    const { optimizeCardImage } = await import("@/lib/optimizeCardImage");
    const optimized = await optimizeCardImage(selectedFile, source, dataUrl);
    setFile(optimized.file);
    setPreview(optimized.dataUrl);
    setImageStats({
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.optimizedBytes,
    });
    return optimized;
  };

  /** Upload icon flow: pick from local folder → optimize → OCR → review */
  const handleUploadFromFolder = async (selectedFile: File) => {
    if (!guardCapture()) return;
    if (!processFile(selectedFile)) return;
    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      captureSourceRef.current = "Upload";
      const optimized = await prepareOptimizedImage(selectedFile, dataUrl, "Upload");
      await runScanPipeline(optimized.file, optimized.dataUrl, true);
      const { loadScanSession } = await import("@/lib/scanSession");
      const session = loadScanSession();
      if (session.imageDataUrl) setPreview(session.imageDataUrl);
      if (session.meta?.originalImageBytes != null && session.meta?.optimizedImageBytes != null) {
        setImageStats({
          originalBytes: session.meta.originalImageBytes,
          optimizedBytes: session.meta.optimizedImageBytes,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to read the selected image.");
    }
  };

  /** Camera icon flow: capture → optimize → OCR → review */
  const handleCameraCapture = async (capturedFile: File) => {
    setCameraOpen(false);
    if (!guardCapture()) return;
    if (!processFile(capturedFile)) return;
    try {
      const dataUrl = await readFileAsDataUrl(capturedFile);
      captureSourceRef.current = "Camera";
      const optimized = await prepareOptimizedImage(capturedFile, dataUrl, "Camera");
      await runScanPipeline(optimized.file, optimized.dataUrl, true);
      const { loadScanSession } = await import("@/lib/scanSession");
      const session = loadScanSession();
      if (session.imageDataUrl) setPreview(session.imageDataUrl);
      if (session.meta?.originalImageBytes != null && session.meta?.optimizedImageBytes != null) {
        setImageStats({
          originalBytes: session.meta.originalImageBytes,
          optimizedBytes: session.meta.optimizedImageBytes,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process camera capture.");
    }
  };

  const runScanPipeline = async (
    activeFile: File,
    activePreview: string,
    autoNavigate: boolean,
  ) => {
    setIsProcessing(true);
    setProgress(10);
    setError(null);

    const progressTimer = window.setInterval(() => {
      setProgress((prev) => (prev >= 90 ? prev : prev + Math.floor(Math.random() * 6 + 3)));
    }, 350);

    try {
      const prefs = loadUserSettings();
      const captureToasts =
        prefs.notificationsEnabled && prefs.captureNotificationsEnabled;
      if (captureToasts) {
        toast.info("Extracting contact details from card...");
      }
      const { scanFileAndStore } = await import("@/lib/scanPipeline");
      await scanFileAndStore(
        activeFile,
        activePreview,
        ({ progress, message }) => {
          setProgress(Math.max(10, progress));
          if (progress >= 100 && captureToasts) toast.success(message);
        },
        captureSourceRef.current,
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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleUploadFromFolder(dropped);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setImageStats(null);
    setProgress(0);
    setError(null);
    setIsComplete(false);
    sessionStorage.removeItem("latestScanImage");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const finishProcessing = (autoNavigate?: boolean) => {
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
    if (!guardCapture()) return;
    try {
      const source = /^camera$/i.test(captureSourceRef.current) ? "Camera" : "Upload";
      const optimized = await prepareOptimizedImage(file, preview, source);
      await runScanPipeline(optimized.file, optimized.dataUrl, false);
    } catch (err) {
      console.error(err);
      setError("Failed to optimize image.");
    }
  };

  const removeRecentScan = (contactId: string) => {
    setRemovedRecentIds((current) => {
      const next = new Set(current);
      next.add(String(contactId));
      localStorage.setItem(REMOVED_RECENT_SCANS_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const visibleRecentContacts = useMemo(() => {
    return [...directoryContacts]
      .filter((contact) => !removedRecentIds.has(String(contact.id)))
      .sort((a, b) => contactRecencyMs(b.createdAt) - contactRecencyMs(a.createdAt))
      .slice(0, RECENT_SCANS_LIMIT);
  }, [directoryContacts, removedRecentIds]);

  return (
    <PageShell title={PAGE.capture.title} description={PAGE.capture.description}>
      <UpgradePlanDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <StorageWarningBanner />

      {/* Interactive greeting banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-5 backdrop-blur-xl shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {greetingText}, <span className="bg-gradient-to-r from-primary to-teal-500 bg-clip-text text-transparent">{firstName}</span>
              </h2>
            </div>
            <p className="text-xs text-muted-foreground">{dateStr}</p>
          </div>
          
          {settings.showCaptureTips ? (
            <div
              className="flex flex-1 max-w-xl cursor-pointer select-none items-center justify-between gap-3 rounded-md border border-border/40 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40"
              onClick={rotateTip}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 animate-pulse text-primary" />
                <span className="font-medium text-foreground/90 transition-all duration-300">
                  {tips[tipIndex]}
                </span>
              </div>
              <span className="ml-2 shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary hover:underline">
                Next tip
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {isBlocked ? (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5 p-5 shadow-soft">
          <h3 className="text-sm font-semibold text-destructive">Storage limit reached</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade your subscription to continue scanning. Camera, gallery, and offline capture are
            paused until storage is available.
          </p>
          <Button asChild className="mt-3 rounded-md bg-gradient-primary shadow-glow">
            <Link to="/subscription">Upgrade Now</Link>
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Dropzone */}
        <Card className="relative overflow-hidden rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-3 flex flex-col">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) handleUploadFromFolder(picked);
              e.target.value = "";
            }}
            accept="image/jpeg,image/png,image/jpg,.jpg,.jpeg,.png"
            className="hidden"
            disabled={isBlocked}
          />
          
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 rounded-2xl border-2 border-dashed p-8 text-center transition-all md:p-12 flex flex-col items-center justify-center ${
              isDragging ? 'border-primary bg-primary/5' : 
              preview ? 'border-border bg-card' : 
              'border-border bg-muted/30 hover:border-primary/40 hover:bg-accent/40'
            }`}
          >
            {preview ? (
              <div className="w-full h-full flex flex-col items-center justify-center fade-in">
                <div className="relative w-full max-w-[240px] rounded-xl overflow-hidden shadow-soft mb-3 border border-border/60">
                  <img src={preview} alt="Card preview" className="w-full h-auto max-h-[160px] object-cover" />
                  {!isProcessing && !isComplete && (
                    <div className="absolute top-2 right-2">
                      <Button variant="secondary" size="icon" className="h-7 w-7 rounded-md bg-background/80 hover:bg-background backdrop-blur shadow-soft text-foreground" onClick={clearFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="text-sm font-medium">{file?.name}</div>
                {imageStats ? (
                  <div className="mt-2 w-full max-w-xs rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-left">
                    <ImageOptimizationStats
                      originalBytes={imageStats.originalBytes}
                      optimizedBytes={imageStats.optimizedBytes}
                    />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
                  </div>
                )}
                
                {error && <div className="mt-3 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-lg">{error}</div>}
                
                {isComplete ? (
                  <div className="w-full max-w-xs mt-6 space-y-3 text-center fade-in">
                    <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium text-success">Successfully processed</div>
                    <div className="flex flex-col gap-2 mt-4">
                      <Button asChild className="w-full rounded-md bg-gradient-primary shadow-glow">
                        <Link to="/review">Review & Save Contact</Link>
                      </Button>
                      <Button variant="outline" className="w-full rounded-md" onClick={clearFile}>
                        Scan another card
                      </Button>
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="w-full max-w-xs mt-6 space-y-2 fade-in">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Processing...</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                      <div className="h-full bg-gradient-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-wrap justify-center gap-2 w-full fade-in">
                    <Button onClick={() => handleProcess()} className="w-full sm:w-auto rounded-md bg-gradient-primary shadow-glow">
                      <ScanLine className="mr-2 h-4 w-4" /> Process card
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="fade-in flex flex-col items-center">
                <div className="pointer-events-none mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-gradient-primary text-primary-foreground shadow-glow">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight pointer-events-none">Drop a business card here</h3>
                <p className="mt-1 text-sm text-muted-foreground pointer-events-none">PNG, JPG or JPEG up to 10MB.</p>
                
                {error && <div className="mt-4 text-sm text-destructive font-medium bg-destructive/10 px-3 py-1.5 rounded-lg">{error}</div>}
                
                <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 w-full">
                    <Button
                      onClick={() => {
                        if (!guardCapture()) return;
                        fileInputRef.current?.click();
                      }}
                      disabled={isBlocked}
                      className="w-full sm:w-auto rounded-md bg-gradient-primary shadow-glow"
                    >
                    <FileImage className="mr-2 h-4 w-4" /> Choose from folder
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!guardCapture()) return;
                      setCameraOpen(true);
                    }}
                    disabled={isBlocked}
                    className="w-full sm:w-auto rounded-md"
                  >
                    <Camera className="mr-2 h-4 w-4" /> Use camera
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI extracts contact details automatically, powered by on-device OCR
          </div>
        </Card>

        {/* Animated scan frame */}
        <Card className="relative overflow-hidden rounded-2xl border-border/60 p-6 shadow-soft lg:col-span-2 flex flex-col">
          <div className="text-sm font-medium">Live preview</div>
          <div className="text-xs text-muted-foreground">
            {isComplete ? "Extraction complete" : isProcessing ? "Scanning..." : preview ? "Ready to scan" : "Awaiting image..."}
          </div>

          <div className="relative mt-4 aspect-[1.6/1] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-slate-900 to-slate-800 shadow-elevated">
            {preview ? (
              <img src={preview} alt="Scanning preview" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isProcessing ? 'opacity-50' : 'opacity-80'}`} />
            ) : (
             <>
             </>
            )}

            {/* corner brackets */}
            {["top-2 left-2 border-l-2 border-t-2", "top-2 right-2 border-r-2 border-t-2", "bottom-2 left-2 border-l-2 border-b-2", "bottom-2 right-2 border-r-2 border-b-2"].map((p) => (
              <div key={p} className={`absolute h-5 w-5 rounded-sm border-primary transition-colors ${isComplete ? 'border-success' : ''} ${p}`} />
            ))}

            {/* scan line */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
              <div className={`absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-primary/40 to-transparent shadow-glow ${isProcessing || (!preview && !isComplete) ? 'animate-scan-line' : 'hidden'}`} />
            </div>
            
            {isComplete && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm fade-in">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-medium text-white">Extracted</div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="rounded-lg bg-muted/40 p-2 transition-colors duration-300" style={{ backgroundColor: isComplete ? 'hsl(var(--success)/0.1)' : '' }}>
              <div className="font-semibold">{isComplete ? '99%' : isProcessing ? '...' : '98%'}</div>
              <div className="text-muted-foreground">Name</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 transition-colors duration-300" style={{ backgroundColor: isComplete ? 'hsl(var(--success)/0.1)' : '' }}>
              <div className="font-semibold">{isComplete ? '98%' : isProcessing ? '...' : '94%'}</div>
              <div className="text-muted-foreground">Email</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-2 transition-colors duration-300" style={{ backgroundColor: isComplete ? 'hsl(var(--success)/0.1)' : '' }}>
              <div className="font-semibold">{isComplete ? '97%' : isProcessing ? '...' : '96%'}</div>
              <div className="text-muted-foreground">Phone</div>
            </div>
          </div>

          {imageStats ? (
            <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <ImageOptimizationStats
                originalBytes={imageStats.originalBytes}
                optimizedBytes={imageStats.optimizedBytes}
              />
            </div>
          ) : null}

          <div className="mt-auto pt-4">
            {isComplete ? (
              <Button asChild className="w-full rounded-md bg-gradient-primary shadow-glow">
                <Link to="/review"><ScanLine className="mr-2 h-4 w-4" /> Review extracted details</Link>
              </Button>
            ) : (
              <Button disabled className="w-full rounded-md bg-gradient-primary shadow-glow">
                <ScanLine className="mr-2 h-4 w-4" /> Review extracted details
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Recent scans are dismissible here without deleting saved contacts. */}
      <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Recent Scans</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Latest {RECENT_SCANS_LIMIT} contacts from your directory.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-md text-xs">
            <Link to="/contacts">View all</Link>
          </Button>
        </div>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
          {visibleRecentContacts.map((c) => (
            <div
              key={c.id}
              className="min-w-[240px] shrink-0 snap-center rounded-2xl border border-border/60 bg-card p-3 shadow-soft transition-transform hover:-translate-y-0.5 sm:min-w-[200px]"
            >
              <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/20">
                <CardImageCell
                  contactId={String(c.id)}
                  hasCardImage={c.hasCardImage}
                  queueImageDataUrl={c.queueImageDataUrl}
                  contactName={c.name}
                  className="w-full"
                  hideName
                  thumbnailClassName="aspect-[1.6/1] h-auto w-full max-h-none rounded-none object-cover"
                />
                <div className={`bg-gradient-to-br ${c.accent} px-3 py-2 text-white`}>
                  <div className="truncate text-xs font-semibold">{c.name}</div>
                  <div className="truncate text-[10px] opacity-80">{c.company}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="truncate text-[11px] text-muted-foreground">{c.lastSync}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRecentScan(String(c.id))}
                  className="h-7 shrink-0 rounded-md px-2 text-[11px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label={`Remove ${c.name || "scan"} from recent scans`}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
          {visibleRecentContacts.length === 0 && (
            <div className="text-xs text-muted-foreground italic py-4 pl-1">No recent scans found.</div>
          )}
        </div>
      </Card>

      {cameraOpen && (
        <Suspense fallback={null}>
          <CameraCapture
            open={cameraOpen}
            onClose={() => setCameraOpen(false)}
            onCapture={handleCameraCapture}
          />
        </Suspense>
      )}
    </PageShell>
  );
}
