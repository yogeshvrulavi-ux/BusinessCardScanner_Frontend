import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useNavigate, useSearch, Link } from "@tanstack/react-router";
import { Loader2, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { J as useForceLightMode, K as AppLogo, B as Button, h as cn, j as loadUserSettings, s as saveUserSettings } from "./router-CTqOT-Nn.js";
import { N as NeuralVortexBackground, A as AuthScannerPanel, a as AuthField } from "./interactive-neural-vortex-background-gTnWQ8e6.js";
import { a as LEGAL_CONTACT_EMAIL, b as LEGAL_CONTACT_PHONE, L as LEGAL_PAGE_URLS } from "./legalContent-W3nnvv-x.js";
import { v as validateInvitationToken, c as acceptInvitation } from "./adminApi-BVIkgpxY.js";
import "@tanstack/react-query";
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
const PASSWORD_HINT = "At least 8 characters with uppercase, lowercase, a number, and a special character.";
function validatePasswordClient(password) {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
  if (!/\d/.test(password)) return "Password needs a digit.";
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) {
    return "Password needs a special character.";
  }
  return null;
}
function RegisterInvitePage() {
  useForceLightMode(true);
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" });
  const token = (search.token || "").trim();
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  useEffect(() => {
    if (!token) {
      setError("Missing invitation token. Open the link from your invitation email.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await validateInvitationToken(token);
        if (cancelled) return;
        setInfo({
          email: data.email,
          role: data.role,
          company_name: data.company_name,
          company_code: data.company_code,
          company_address: data.company_address,
          company_phone: data.company_phone,
          company_email: data.company_email,
          company_website: data.company_website,
          needs_company: data.needs_company,
          expires_at: data.expires_at
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Invalid invitation.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);
  const roleLabel = info?.role === "ADMIN" ? "Admin" : info?.role === "USER" ? "User" : info?.role;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !info) return;
    const nextErrors = {};
    if (!fullName.trim()) nextErrors.fullName = "Full name is required.";
    const pwErr = validatePasswordClient(password);
    if (pwErr) nextErrors.password = pwErr;
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await acceptInvitation({
        token,
        full_name: fullName.trim(),
        password,
        confirm_password: confirmPassword,
        phone: phone.trim()
      });
      const current = loadUserSettings();
      saveUserSettings({
        ...current,
        fullName: fullName.trim(),
        email: result.user.email,
        phone: result.user.phone || phone.trim(),
        company: result.user.company_name || info.company_name || current.company,
        role: roleLabel || current.role
      });
      toast.success("Account created. Please sign in.");
      void navigate({
        to: "/auth/$pathname",
        params: { pathname: "sign-in" },
        replace: true
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "light flex h-svh w-full max-w-[100vw] flex-col overflow-hidden bg-background lg:flex-row", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative hidden w-full min-w-0 items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:h-svh lg:w-[42%]", children: [
      /* @__PURE__ */ jsx(NeuralVortexBackground, { contained: true }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex w-full min-w-0 max-w-lg items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14", children: /* @__PURE__ */ jsx(AuthScannerPanel, {}) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative flex h-svh w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f4f7fb] lg:w-[58%]", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute right-0 top-0 h-72 w-72 max-w-[50%] translate-x-1/4 rounded-full bg-violet-300/15 blur-3xl" }),
      /* @__PURE__ */ jsx("header", { className: "relative z-10 flex shrink-0 justify-end px-5 py-3 sm:px-10 lg:px-14", children: /* @__PURE__ */ jsxs("div", { className: "text-right text-sm leading-relaxed", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-[#1e3a5f]", children: "Need help?" }),
        /* @__PURE__ */ jsx("a", { href: `mailto:${LEGAL_CONTACT_EMAIL}`, className: "block font-medium text-primary hover:text-primary/80", children: LEGAL_CONTACT_EMAIL }),
        /* @__PURE__ */ jsx("a", { href: `tel:${LEGAL_CONTACT_PHONE}`, className: "block font-medium text-primary hover:text-primary/80", children: LEGAL_CONTACT_PHONE })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex flex-1 overflow-y-auto px-5 py-4 sm:px-10 lg:px-14", children: /* @__PURE__ */ jsx("div", { className: "m-auto w-full min-w-0 max-w-lg sm:max-w-xl", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full rounded-2xl bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-5 flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(AppLogo, { size: "md" }),
          /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
            /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "CardScan" }),
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Scan · Detect · Extract" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-5 space-y-1.5", children: [
          /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-bold tracking-tight text-[#1e3a5f]", children: "Complete your invitation" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: "Create your account with your own details and password. Login is only possible after you submit this form — the inviter never sets your password." })
        ] }),
        loading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-14", children: [
          /* @__PURE__ */ jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Validating invitation…" })
        ] }),
        !loading && error && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("p", { className: "rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive", children: error }),
          /* @__PURE__ */ jsx(Button, { asChild: true, variant: "outline", className: "h-11 w-full rounded-xl", children: /* @__PURE__ */ jsx(Link, { to: "/auth/$pathname", params: { pathname: "sign-in" }, children: "Go to sign in" }) })
        ] }),
        !loading && info && /* @__PURE__ */ jsxs("form", { className: "space-y-5", onSubmit: handleSubmit, noValidate: true, children: [
          /* @__PURE__ */ jsxs("section", { className: "space-y-3.5", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Account" }),
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3.5 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsx(
                AuthField,
                {
                  label: "Full name *",
                  value: fullName,
                  onChange: (e) => setFullName(e.target.value),
                  autoComplete: "name",
                  error: fieldErrors.fullName
                }
              ),
              /* @__PURE__ */ jsx(
                AuthField,
                {
                  label: "Phone",
                  type: "tel",
                  value: phone,
                  onChange: (e) => setPhone(e.target.value),
                  placeholder: "+91 XXXXX XXXXX",
                  autoComplete: "tel"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              AuthField,
              {
                label: "Email",
                type: "email",
                value: info.email,
                readOnly: true,
                disabled: true,
                autoComplete: "email"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("section", { className: "space-y-3.5", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid gap-3.5 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsx(
                AuthField,
                {
                  label: "Password *",
                  type: showPassword ? "text" : "password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  autoComplete: "new-password",
                  error: fieldErrors.password,
                  trailing: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      onClick: () => setShowPassword((v) => !v),
                      "aria-label": showPassword ? "Hide password" : "Show password",
                      children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx(
                AuthField,
                {
                  label: "Confirm password *",
                  type: showConfirm ? "text" : "password",
                  value: confirmPassword,
                  onChange: (e) => setConfirmPassword(e.target.value),
                  autoComplete: "new-password",
                  error: fieldErrors.confirmPassword,
                  trailing: /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      onClick: () => setShowConfirm((v) => !v),
                      "aria-label": showConfirm ? "Hide password" : "Show password",
                      children: showConfirm ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "-mt-1 text-[11px] text-muted-foreground", children: PASSWORD_HINT })
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              disabled: submitting,
              className: cn(
                "h-12 w-full rounded-xl bg-gradient-primary text-base font-semibold shadow-glow"
              ),
              children: [
                submitting ? /* @__PURE__ */ jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }) : null,
                "Create account"
              ]
            }
          ),
          /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-muted-foreground", children: [
            "Already registered?",
            " ",
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/auth/$pathname",
                params: { pathname: "sign-in" },
                className: "font-medium text-primary hover:text-primary/80",
                children: "Sign in"
              }
            )
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxs("footer", { className: "relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-center text-md text-[#1e3a5f] sm:px-10 lg:px-14", children: [
        /* @__PURE__ */ jsx("a", { href: LEGAL_PAGE_URLS.privacy, target: "_blank", rel: "noopener noreferrer", className: "hover:text-foreground", children: "Privacy Policy" }),
        /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-border", children: "·" }),
        /* @__PURE__ */ jsx("a", { href: LEGAL_PAGE_URLS.terms, target: "_blank", rel: "noopener noreferrer", className: "hover:text-foreground", children: "Terms & Conditions" })
      ] })
    ] })
  ] });
}
const SplitComponent = RegisterInvitePage;
export {
  SplitComponent as component
};
