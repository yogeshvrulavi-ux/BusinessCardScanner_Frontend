import { forwardRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AuthFieldProps = React.ComponentProps<"input"> & {
  label: string;
  error?: string;
  /** Element rendered inside the input, vertically centered on the right (e.g. password toggle). */
  trailing?: ReactNode;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ label, error, className, id, trailing, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-[#1e3a5f]/90">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full rounded-md border border-slate-200 bg-white px-4 text-sm text-foreground outline-none transition-all",
              "placeholder:text-muted-foreground/60",
              "focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/15",
              error && "border-destructive/70 focus:border-destructive focus:ring-destructive/15",
              trailing && "pr-11",
              className,
            )}
            {...props}
          />
          {trailing ? (
            <div className="absolute inset-y-0 right-1.5 flex items-center">{trailing}</div>
          ) : null}
        </div>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  },
);

AuthField.displayName = "AuthField";
