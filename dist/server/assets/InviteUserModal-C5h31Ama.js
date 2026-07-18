import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogDescription, L as Label, e as DialogFooter } from "./label-BadV_bVl.js";
import { u as useAuth, I as Input, B as Button } from "./router-Bh1EUmi_.js";
import { toast } from "sonner";
import { s as sendInvitation } from "./adminApi-dUj9P00y.js";
function InviteUserModal({ open, onOpenChange, onSuccess }) {
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const inviteRole = isSuperAdmin ? "ADMIN" : "USER";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reset = () => setEmail("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await sendInvitation({
        email: email.trim(),
        role: inviteRole
      });
      toast.success(`Invitation sent to ${email.trim()}. They must register before they can log in.`);
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsx(
    Dialog,
    {
      open,
      onOpenChange: (v) => {
        if (!v) reset();
        onOpenChange(v);
      },
      children: /* @__PURE__ */ jsxs(DialogContent, { className: "max-w-md rounded-2xl", children: [
        /* @__PURE__ */ jsxs(DialogHeader, { children: [
          /* @__PURE__ */ jsxs(DialogTitle, { children: [
            "Invite ",
            isSuperAdmin ? "Admin" : "User"
          ] }),
          /* @__PURE__ */ jsx(DialogDescription, { children: "Enter their email only. They will receive a secure link to create their own password and complete their profile. You never set their password or personal details." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "invite_email", children: isSuperAdmin ? "Admin email *" : "User email *" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                id: "invite_email",
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: isSuperAdmin ? "admin@company.com" : "user@company.com",
                required: true,
                autoFocus: true
              }
            ),
            /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-xs text-muted-foreground", children: "Account is created only after they open the invite and submit registration. Login is not possible until then." })
          ] }),
          /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), children: "Cancel" }),
            /* @__PURE__ */ jsxs(Button, { type: "submit", disabled: isSubmitting, className: "bg-gradient-primary", children: [
              isSubmitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Mail, { className: "mr-2 h-4 w-4" }),
              "Send invitation"
            ] })
          ] })
        ] })
      ] })
    }
  );
}
export {
  InviteUserModal as I
};
