import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TABLE_PAGE_SIZE = 10;

type TablePaginationProps = {
  page: number;
  total: number;
  limit?: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
};

export function TablePagination({
  page,
  total,
  limit = TABLE_PAGE_SIZE,
  onPageChange,
  disabled = false,
  className,
}: TablePaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = total === 0 ? 0 : Math.min(safePage * limit, total);
  const canPrev = safePage > 1 && !disabled;
  const canNext = safePage < pageCount && !disabled;

  if (total <= 0) return null;

  return (
    <div
      className={cn(
        "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-xs text-muted-foreground tabular-nums">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md"
          disabled={!canPrev}
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground">
          Page {safePage} of {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-md"
          disabled={!canNext}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/** If the current page has no rows after a delete, step back one page. */
export function clampPageAfterDelete(page: number, totalAfter: number, limit = TABLE_PAGE_SIZE): number {
  const maxPage = Math.max(1, Math.ceil(totalAfter / limit) || 1);
  return Math.min(page, maxPage);
}
