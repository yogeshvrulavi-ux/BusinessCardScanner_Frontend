import { jsxs, jsx } from "react/jsx-runtime";
import { AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { h as cn } from "./router-VRE0sT79.js";
const map = {
  synced: {
    label: "Synced",
    icon: CheckCircle2,
    cls: "bg-success/10 text-success border-success/20"
  },
  pending: {
    label: "Pending",
    icon: Clock,
    cls: "bg-warning/15 text-warning-foreground border-warning/30"
  },
  failed: {
    label: "Failed",
    icon: AlertTriangle,
    cls: "bg-destructive/10 text-destructive border-destructive/20"
  }
};
function StatusPill({ status, className }) {
  const m = map[status];
  const Icon = m.icon;
  return /* @__PURE__ */ jsxs(
    "span",
    {
      className: cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        m.cls,
        className
      ),
      children: [
        /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
        m.label
      ]
    }
  );
}
export {
  StatusPill as S
};
