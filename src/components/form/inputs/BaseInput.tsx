import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = { as?: "input" | "textarea"; value: string; placeholder?: string; type?: string; onChange: (value: string) => void };

export const FieldClearButton = ({
  onClear,
  disabled = false,
  className,
}: {
  onClear: () => void;
  disabled?: boolean;
  className?: string;
}) => (
  <button
    type="button"
    tabIndex={-1}
    aria-label="Clear field"
    onClick={onClear}
    disabled={disabled}
    className={cn(
      "absolute flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors",
      disabled
        ? "cursor-default opacity-30"
        : "hover:bg-muted hover:text-foreground",
      className,
    )}
  >
    <X className="h-3.5 w-3.5" />
  </button>
);

export const BaseInput = ({ as = "input", value, placeholder, type = "text", onChange }: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = value.length > 0;

  // Auto-grow the textarea so multi-line values (e.g. full addresses) fit their
  // content while empty fields stay the same height as regular inputs.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 44)}px`;
  }, [value]);

  if (as === "textarea") {
    return (
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          placeholder={placeholder}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[44px] resize-none overflow-hidden rounded-sm border-border/60 bg-background py-2.5 pr-9 leading-relaxed"
        />
        <FieldClearButton
          onClear={() => onChange("")}
          disabled={!hasValue}
          className="right-1.5 top-2.5"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-sm border-border/60 bg-background pr-9"
      />
      <FieldClearButton
        onClear={() => onChange("")}
        disabled={!hasValue}
        className="right-1.5 top-1/2 -translate-y-1/2"
      />
    </div>
  );
};
