import { jsxs, jsx } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { B as Button, h as cn } from "./router-CKY3IDgE.js";
const TABLE_PAGE_SIZE = 10;
function TablePagination({
  page,
  total,
  limit = TABLE_PAGE_SIZE,
  onPageChange,
  disabled = false,
  className
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = total === 0 ? 0 : Math.min(safePage * limit, total);
  const canPrev = safePage > 1 && !disabled;
  const canNext = safePage < pageCount && !disabled;
  if (total <= 0) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      ),
      children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground tabular-nums", children: [
          "Showing ",
          from,
          "–",
          to,
          " of ",
          total
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "h-8 rounded-md",
              disabled: !canPrev,
              onClick: () => onPageChange(safePage - 1),
              children: [
                /* @__PURE__ */ jsx(ChevronLeft, { className: "mr-1 h-4 w-4" }),
                "Previous"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "min-w-[4.5rem] text-center text-xs tabular-nums text-muted-foreground", children: [
            "Page ",
            safePage,
            " of ",
            pageCount
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "button",
              variant: "outline",
              size: "sm",
              className: "h-8 rounded-md",
              disabled: !canNext,
              onClick: () => onPageChange(safePage + 1),
              children: [
                "Next",
                /* @__PURE__ */ jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
              ]
            }
          )
        ] })
      ]
    }
  );
}
function clampPageAfterDelete(page, totalAfter, limit = TABLE_PAGE_SIZE) {
  const maxPage = Math.max(1, Math.ceil(totalAfter / limit) || 1);
  return Math.min(page, maxPage);
}
export {
  TABLE_PAGE_SIZE as T,
  TablePagination as a,
  clampPageAfterDelete as c
};
