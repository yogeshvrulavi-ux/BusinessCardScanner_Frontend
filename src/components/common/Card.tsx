import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={cn("rounded-3xl border border-border/50 bg-card p-5 shadow-soft md:p-6", className)}>{children}</div>
);
