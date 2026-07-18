import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const FormSection = ({
  title,
  action,
  children,
  className,
}: {
  title: string;
  /** Optional control rendered on the right side of the section header. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <section className={cn("space-y-4", className)}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      {action}
    </div>
    {children}
  </section>
);
