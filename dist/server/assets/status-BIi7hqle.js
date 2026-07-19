import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { l as listContacts, g as getQueueItems } from "./router-CTqOT-Nn.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "sonner";
import "lucide-react";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-separator";
import "@radix-ui/react-dialog";
import "@radix-ui/react-tooltip";
import "idb";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-alert-dialog";
import "zod";
function StatusPage() {
  const [status, setStatus] = useState("Loading…");
  const [error, setError] = useState(null);
  useEffect(() => {
    Promise.all([listContacts(), getQueueItems()]).then(([contacts, queue]) => {
      setStatus(
        JSON.stringify(
          {
            mode: "client-only",
            storage: "IndexedDB",
            contacts: contacts.length,
            queue: queue.length,
            online: typeof navigator !== "undefined" ? navigator.onLine : true
          },
          null,
          2
        )
      );
    }).catch((err) => {
      setError(err instanceof Error ? err.message : "Failed");
      setStatus("Failed");
    });
  }, []);
  return /* @__PURE__ */ jsxs("div", { style: { fontFamily: "Inter, sans-serif", padding: "2rem" }, children: [
    /* @__PURE__ */ jsx("h1", { style: { fontSize: "2rem", marginBottom: "1rem" }, children: "App status" }),
    /* @__PURE__ */ jsx(
      "pre",
      {
        style: {
          background: "#1e1e1e",
          color: "#d4d4d4",
          padding: "1rem",
          borderRadius: "8px",
          overflowX: "auto"
        },
        children: error ? `Error: ${error}` : status
      }
    )
  ] });
}
const SplitComponent = StatusPage;
export {
  SplitComponent as component
};
