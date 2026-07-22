import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

export const FormActions = ({
  onClear,
  clearDisabled,
  onReset,
  onSave,
  saving,
  saveDisabled,
  saveHint,
}: {
  onClear?: () => void;
  clearDisabled?: boolean;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
  saveDisabled?: boolean;
  saveHint?: string;
}) => (
  <div className="sticky bottom-0 z-20 mt-6 space-y-3 bg-background/90 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:static sm:bg-transparent sm:p-0">
    {saveHint ? (
      <p className="text-xs text-amber-700 dark:text-amber-300">{saveHint}</p>
    ) : null}
    <div className="flex flex-wrap gap-3">
      {onClear ? (
        <Button
          variantType="outline"
          className="min-w-[7rem] flex-1 rounded-sm text-destructive hover:bg-destructive/5 hover:text-destructive sm:flex-none"
          onClick={onClear}
          disabled={clearDisabled}
        >
          <X className="mr-1.5 h-4 w-4" />
          Clear Fields
        </Button>
      ) : null}
      <Button variantType="secondary" className="min-w-[7rem] flex-1 rounded-md sm:flex-none" onClick={onReset}>
        Discard
      </Button>
      <Button
        variantType="primary"
        className="min-w-[7rem] flex-1 rounded-sm sm:flex-none"
        onClick={onSave}
        disabled={saving || saveDisabled}
      >
        {saving ? "Saving..." : "Save Lead"}
      </Button>
    </div>
  </div>
);
