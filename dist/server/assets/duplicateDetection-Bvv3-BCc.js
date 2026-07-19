import { a3 as listStoredContacts } from "./router-CTqOT-Nn.js";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "react";
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
function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}
function findDuplicatesLocally(contacts, payload) {
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = normalizePhone(payload.phone || "");
  const name = String(payload.fullName || "").trim().toLowerCase();
  const company = String(payload.company || "").trim().toLowerCase();
  const duplicates = [];
  const seen = /* @__PURE__ */ new Set();
  for (const contact of contacts) {
    const id = String(contact.id || "");
    if (!id || seen.has(id)) continue;
    const matchedBy = [];
    const cEmail = String(contact.email || "").trim().toLowerCase();
    const cPhone = normalizePhone(String(contact.phone || ""));
    const cName = String(contact.fullName || contact.name || "").trim().toLowerCase();
    const cCompany = String(contact.company || "").trim().toLowerCase();
    if (email && cEmail && email === cEmail) matchedBy.push("email");
    if (phone && cPhone && phone === cPhone) matchedBy.push("phone");
    if (name && company && cName === name && cCompany === company) matchedBy.push("name_company");
    if (matchedBy.length > 0) {
      seen.add(id);
      duplicates.push({ contact, matchedBy });
    }
  }
  return duplicates;
}
async function checkForDuplicates(payload) {
  if (typeof navigator === "undefined" || navigator.onLine) {
    try {
      const { API_BASE_URL } = await import("./router-CTqOT-Nn.js").then((n) => n.a5);
      const { apiFetch } = await import("./router-CTqOT-Nn.js").then((n) => n.a4);
      const response = await apiFetch(`${API_BASE_URL}/contacts/check-duplicates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: payload.fullName || "",
          company: payload.company || "",
          phone: payload.phone || "",
          email: payload.email || ""
        })
      });
      if (response.ok) {
        const data = await response.json();
        return { duplicates: Array.isArray(data.duplicates) ? data.duplicates : [] };
      }
    } catch {
    }
  }
  const contacts = await listStoredContacts();
  const localMatches = findDuplicatesLocally(contacts, payload);
  try {
    const { getQueueItems } = await import("./router-CTqOT-Nn.js").then((n) => n.a6);
    const queueItems = await getQueueItems();
    const queueAsContacts = queueItems.map((item) => ({
      id: item.id,
      ...item.contact_data,
      fullName: String(item.contact_data.fullName || item.contact_data.name || ""),
      email: String(item.contact_data.email || ""),
      phone: String(item.contact_data.phone || ""),
      company: String(item.contact_data.company || "")
    }));
    const queueMatches = findDuplicatesLocally(queueAsContacts, payload);
    const seen = new Set(localMatches.map((m) => m.contact.id));
    for (const match of queueMatches) {
      if (!seen.has(match.contact.id)) {
        localMatches.push(match);
        seen.add(match.contact.id);
      }
    }
  } catch {
  }
  return { duplicates: localMatches };
}
function diffContacts(existing, incoming) {
  const fields = [
    { key: "fullName", label: "Name", existingKey: "fullName" },
    { key: "designation", label: "Designation" },
    { key: "company", label: "Company" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
    { key: "address", label: "Address" }
  ];
  return fields.map(({ key, label, existingKey }) => {
    const ex = String(existing[existingKey || key] || existing.name || "").trim();
    const inc = String(incoming[key] || "").trim();
    if (!ex && !inc) return null;
    if (ex === inc) return null;
    return { field: label, existing: ex || "—", incoming: inc || "—" };
  }).filter(Boolean);
}
export {
  checkForDuplicates,
  diffContacts
};
