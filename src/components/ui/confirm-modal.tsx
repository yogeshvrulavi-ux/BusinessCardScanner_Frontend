import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmOptions = {
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

export type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title = "Are you sure?",
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const lines = description.split("\n").filter((line) => line.length > 0);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="max-w-md rounded-2xl border-border/60 shadow-soft">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            className="rounded-xl"
            onClick={(e) => {
              e.preventDefault();
              onCancel();
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            className={cn(
              "rounded-xl",
              !destructive && "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90",
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
};

const ConfirmModalContext = createContext<ConfirmContextValue | null>(null);

function normalizeOptions(options: ConfirmOptions | string): ConfirmOptions {
  return typeof options === "string" ? { description: options } : options;
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);

  const confirm = useCallback((options: ConfirmOptions | string) => {
    const opts = normalizeOptions(options);
    return new Promise<boolean>((resolve) => {
      setRequest({ ...opts, resolve });
    });
  }, []);

  const close = useCallback((confirmed: boolean) => {
    setRequest((current) => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmModalContext.Provider value={value}>
      {children}
      {request ? (
        <ConfirmModal
          open
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          destructive={request.destructive}
          onConfirm={() => close(true)}
          onCancel={() => close(false)}
        />
      ) : null}
    </ConfirmModalContext.Provider>
  );
}

export function useConfirmModal(): ConfirmContextValue {
  const ctx = useContext(ConfirmModalContext);
  if (!ctx) {
    throw new Error("useConfirmModal must be used within ConfirmModalProvider");
  }
  return ctx;
}
