import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  showClose?: boolean;
};

/** General-purpose modal (Radix Dialog). Use ConfirmModal / useConfirmModal for yes/no flows. */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  showClose = true,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg rounded-2xl border-border/60 shadow-soft",
          !showClose && "[&>button]:hidden",
          className,
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title ? <DialogTitle className="font-display text-lg">{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        )}
        {children}
        {footer ? <DialogFooter className="gap-2 sm:gap-2">{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}
