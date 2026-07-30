import { useId, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CUSTOM_EVENT_DAY_VALUE,
  DEFAULT_EVENT_DAY,
  PRESET_EVENT_DAYS,
  isPresetEventDay,
  normalizeEventDay,
} from "@/constants/eventDays";
import { cn } from "@/lib/utils";

type EventDaySelectProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
};

export function EventDaySelect({
  value,
  onChange,
  disabled = false,
  error,
}: EventDaySelectProps) {
  const inputId = useId();
  const normalized = normalizeEventDay(value);
  const isCustom = !isPresetEventDay(normalized);
  const [customDraft, setCustomDraft] = useState(isCustom ? normalized : "");

  const selectValue = isCustom ? CUSTOM_EVENT_DAY_VALUE : normalized;

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
        Event day
      </Label>
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={(next) => {
          if (next === CUSTOM_EVENT_DAY_VALUE) {
            const draft = customDraft.trim() || "";
            setCustomDraft(draft);
            onChange(draft || "Custom");
            return;
          }
          onChange(next);
        }}
      >
        <SelectTrigger
          id={inputId}
          className={cn(
            "h-11 w-full rounded-md border-border/60 bg-background",
            error && "border-destructive/60",
          )}
        >
          <SelectValue placeholder={DEFAULT_EVENT_DAY} />
        </SelectTrigger>
        <SelectContent>
          {PRESET_EVENT_DAYS.map((day) => (
            <SelectItem key={day} value={day}>
              {day}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM_EVENT_DAY_VALUE}>Custom…</SelectItem>
        </SelectContent>
      </Select>

      {isCustom ? (
        <Input
          value={customDraft || (normalized !== "Custom" ? normalized : "")}
          disabled={disabled}
          placeholder="Enter custom event day"
          autoComplete="off"
          className={cn(
            "h-11 rounded-md border-border/60 bg-background",
            error && "border-destructive/60",
          )}
          onChange={(e) => {
            const next = e.target.value;
            setCustomDraft(next);
            onChange(next.trim() || "Custom");
          }}
        />
      ) : null}

      <p className="text-xs text-muted-foreground">
        Contacts are grouped by exhibition day for Google Sheets worksheets.
      </p>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
