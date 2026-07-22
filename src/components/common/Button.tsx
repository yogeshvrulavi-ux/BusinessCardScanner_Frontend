import { Button as UIButton } from "@/components/ui/button";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<typeof UIButton> & { variantType?: "primary" | "secondary" | "outline" | "danger" };

const classes = {
  primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95",
  secondary: "border border-sky-200/80 bg-sky-50 text-slate-700 hover:bg-sky-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
  outline: "border border-border/60 bg-transparent hover:bg-muted/60",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
} as const;

export const Button = ({ className, variantType = "primary", ...props }: Props) => (
  <UIButton className={cn("rounded-md", classes[variantType], className)} {...props} />
);
