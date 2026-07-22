import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CircleAlert, EyeOff, Eye, Loader2, Minus, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { u as useAuth, a0 as resolvePostAuthPath, H as AppLogo, h as cn, i as invalidateContactsDirectory, d as API_BASE_URL, G as useForceLightMode, a1 as Route } from "./router-VRE0sT79.js";
import { a as AuthField, N as NeuralVortexBackground, A as AuthScannerPanel } from "./interactive-neural-vortex-background-CJyyZJtz.js";
import { OTPInput, OTPInputContext } from "input-otp";
import { a as LEGAL_CONTACT_EMAIL, b as LEGAL_CONTACT_PHONE, L as LEGAL_PAGE_URLS } from "./legalContent-W3nnvv-x.js";
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
const signInSchema = z.object({
  identifier: z.string().min(1, "Enter your email or username"),
  password: z.string().min(1, "Enter your password"),
  rememberMe: z.boolean().optional()
});
function extractErrorMessage(error) {
  if (error instanceof Error) {
    const msg = error.message;
    if (/failed to fetch|networkerror|name not resolved|err_name_not_resolved/i.test(msg)) {
      return "Cannot reach the server. Please check your connection and try again.";
    }
    return msg;
  }
  if (error && typeof error === "object") {
    const record = error;
    if (typeof record.detail === "string") return record.detail;
    if (typeof record.detail === "object" && record.detail?.message) return record.detail.message;
    if (record.message) return record.message;
  }
  return "Something went wrong. Please try again.";
}
function AuthCredentialsForm({ mode }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");
  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { identifier: "", password: "", rememberMe: true }
  });
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      navigate({ to: resolvePostAuthPath(user.role), replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);
  const onSignIn = async (values) => {
    setSubmitting(true);
    setLoginError("");
    try {
      await login(values.identifier.trim(), values.password);
      invalidateContactsDirectory();
      toast.success("Welcome back!");
    } catch (error) {
      const message = extractErrorMessage(error);
      setLoginError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full min-w-0 max-w-lg rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(AppLogo, { size: "md" }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "NameCardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Instant Capture, Sync & Connect" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-7 space-y-1.5", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-bold tracking-tight text-[#1e3a5f] sm:text-3xl", children: "Welcome back" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: "Sign in to continue scanning and syncing contacts." })
    ] }),
    loginError && /* @__PURE__ */ jsxs(
      "div",
      {
        role: "alert",
        className: "mb-5 flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive",
        children: [
          /* @__PURE__ */ jsx(CircleAlert, { className: "mt-0.5 h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: loginError })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("form", { className: "space-y-5", onSubmit: signInForm.handleSubmit(onSignIn), noValidate: true, children: [
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Email or Username",
          type: "text",
          autoComplete: "username",
          placeholder: "you@company.com",
          error: signInForm.formState.errors.identifier?.message,
          ...signInForm.register("identifier")
        }
      ),
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Password",
          type: showPassword ? "text" : "password",
          autoComplete: "current-password",
          placeholder: "••••••••",
          error: signInForm.formState.errors.password?.message,
          trailing: /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              onClick: () => setShowPassword((v) => !v),
              "aria-label": showPassword ? "Hide password" : "Show password",
              children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
            }
          ),
          ...signInForm.register("password")
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3 text-sm", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex cursor-pointer items-center gap-2 text-muted-foreground", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              className: "h-4 w-4 rounded border-border accent-primary",
              ...signInForm.register("rememberMe")
            }
          ),
          "Remember me"
        ] }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/auth/$pathname",
            params: { pathname: "forgot-password" },
            className: "font-medium text-primary transition-colors hover:text-primary/80",
            children: "Forgot password?"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(SubmitButton$1, { loading: submitting, label: "Log in" })
    ] })
  ] });
}
function SubmitButton$1({ loading, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: cn(
        "mt-1 flex h-9 w-full items-center justify-center rounded-md bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all",
        "hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      ),
      children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : label
    }
  );
}
const InputOTP = React.forwardRef(({ className, containerClassName, ...props }, ref) => /* @__PURE__ */ jsx(
  OTPInput,
  {
    ref,
    containerClassName: cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    ),
    className: cn("disabled:cursor-not-allowed", className),
    ...props
  }
));
InputOTP.displayName = "InputOTP";
const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, className: cn("flex items-center", className), ...props }));
InputOTPGroup.displayName = "InputOTPGroup";
const InputOTPSlot = React.forwardRef(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      className: cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      ),
      ...props,
      children: [
        char,
        hasFakeCaret && /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "h-4 w-px animate-caret-blink bg-foreground duration-1000" }) })
      ]
    }
  );
});
InputOTPSlot.displayName = "InputOTPSlot";
const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("div", { ref, role: "separator", ...props, children: /* @__PURE__ */ jsx(Minus, {}) }));
InputOTPSeparator.displayName = "InputOTPSeparator";
function apiUrl(path) {
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}${path}`;
}
async function parseError(response) {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      return body.detail.map((item) => item.msg).filter(Boolean).join(", ");
    }
  } catch {
  }
  return `Request failed (${response.status})`;
}
async function sendPasswordResetOtp(email) {
  const response = await fetch(apiUrl("/api/auth/password-reset/send-otp"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() })
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
async function confirmPasswordReset(input) {
  const response = await fetch(apiUrl("/api/auth/password-reset/confirm"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      otp: input.otp.trim(),
      password: input.password,
      confirmPassword: input.confirmPassword
    })
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
const emailSchema = z.object({
  email: z.string().email("Enter a valid email")
});
const resetSchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState("");
  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  });
  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { otp: "", password: "", confirmPassword: "" }
  });
  const onSendOtp = async (values) => {
    setSubmitting(true);
    try {
      const result = await sendPasswordResetOtp(values.email);
      setEmail(values.email.trim());
      setStep("reset");
      setOtp("");
      resetForm.reset({ otp: "", password: "", confirmPassword: "" });
      toast.success(result.message || "Verification code sent.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send code.");
    } finally {
      setSubmitting(false);
    }
  };
  const onConfirmReset = async (values) => {
    setSubmitting(true);
    try {
      const result = await confirmPasswordReset({
        email,
        otp: values.otp,
        password: values.password,
        confirmPassword: values.confirmPassword
      });
      toast.success(result.message || "Password updated.");
      navigate({ to: "/auth/$pathname", params: { pathname: "sign-in" }, replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full min-w-0 max-w-lg rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(AppLogo, { size: "md" }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "NameCardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Instant Capture, Sync & Connect" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-7 space-y-1.5", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-bold tracking-tight text-[#1e3a5f] sm:text-3xl", children: "Reset password" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: step === "email" ? "Enter your email and we'll send a 6-digit verification code." : `Enter the code sent to ${email} and choose a new password.` })
    ] }),
    step === "email" ? /* @__PURE__ */ jsxs("form", { className: "space-y-5", onSubmit: emailForm.handleSubmit(onSendOtp), noValidate: true, children: [
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@company.com",
          error: emailForm.formState.errors.email?.message,
          ...emailForm.register("email")
        }
      ),
      /* @__PURE__ */ jsx(SubmitButton, { loading: submitting, label: "Send verification code" })
    ] }) : /* @__PURE__ */ jsxs(
      "form",
      {
        className: "space-y-5",
        onSubmit: resetForm.handleSubmit(onConfirmReset),
        noValidate: true,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("label", { className: "text-sm font-medium text-[#1e3a5f]/90", children: "Verification code" }),
            /* @__PURE__ */ jsx(
              InputOTP,
              {
                maxLength: 6,
                value: otp,
                onChange: (value) => {
                  setOtp(value);
                  resetForm.setValue("otp", value, { shouldValidate: true });
                },
                children: /* @__PURE__ */ jsx(InputOTPGroup, { className: "w-full justify-between gap-2", children: [0, 1, 2, 3, 4, 5].map((index) => /* @__PURE__ */ jsx(
                  InputOTPSlot,
                  {
                    index,
                    className: "h-11 w-11 rounded-xl border-slate-200 text-base"
                  },
                  index
                )) })
              }
            ),
            resetForm.formState.errors.otp?.message ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: resetForm.formState.errors.otp.message }) : null
          ] }),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "New password",
              type: showPassword ? "text" : "password",
              autoComplete: "new-password",
              placeholder: "At least 8 characters",
              error: resetForm.formState.errors.password?.message,
              trailing: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  onClick: () => setShowPassword((v) => !v),
                  "aria-label": showPassword ? "Hide password" : "Show password",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
                }
              ),
              ...resetForm.register("password")
            }
          ),
          /* @__PURE__ */ jsx(
            AuthField,
            {
              label: "Confirm new password",
              type: showConfirm ? "text" : "password",
              autoComplete: "new-password",
              placeholder: "Repeat new password",
              error: resetForm.formState.errors.confirmPassword?.message,
              trailing: /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  onClick: () => setShowConfirm((v) => !v),
                  "aria-label": showConfirm ? "Hide password" : "Show password",
                  children: showConfirm ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
                }
              ),
              ...resetForm.register("confirmPassword")
            }
          ),
          /* @__PURE__ */ jsx(SubmitButton, { loading: submitting, label: "Update password" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground",
              onClick: () => {
                setStep("email");
                setOtp("");
              },
              children: "Use a different email"
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("p", { className: "mt-7 text-center text-sm text-muted-foreground", children: [
      "Remember your password?",
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/auth/$pathname",
          params: { pathname: "sign-in" },
          className: "font-semibold text-primary transition-colors hover:text-primary/80",
          children: "Back to login"
        }
      )
    ] })
  ] });
}
function SubmitButton({ loading, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: cn(
        "mt-1 flex h-9 w-full items-center justify-center rounded-md bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all",
        "hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      ),
      children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : label
    }
  );
}
function AccessDeniedPanel() {
  const { user } = useAuth();
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full min-w-0 max-w-lg rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(AppLogo, { size: "md" }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "NameCardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Instant Capture, Sync & Connect" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-8 text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10", children: /* @__PURE__ */ jsx(ShieldX, { className: "h-8 w-8 text-destructive" }) }),
      /* @__PURE__ */ jsx("h1", { className: "mt-4 font-display text-2xl font-bold tracking-tight text-[#1e3a5f]", children: "Access Denied" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground", children: [
        "You don't have permission to access this page.",
        user?.role && /* @__PURE__ */ jsxs("span", { className: "mt-1 block", children: [
          "Your role: ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: user.role })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/scan",
            className: "h-9 rounded-md bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:opacity-95",
            children: "Go to Dashboard"
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/auth/$pathname",
            params: { pathname: "sign-in" },
            className: "inline-flex h-9 items-center rounded-md border border-border px-5 text-sm font-medium transition-colors hover:bg-muted",
            children: "Sign in as different user"
          }
        )
      ] })
    ] })
  ] });
}
function normalizeMode(pathname) {
  if (pathname === "forgot-password") return "forgot-password";
  if (pathname === "access-denied") return "access-denied";
  return "sign-in";
}
function AuthPage({ pathname }) {
  const mode = normalizeMode(pathname);
  useForceLightMode(true);
  return /* @__PURE__ */ jsxs("div", { className: "light flex min-h-svh w-full max-w-[100vw] flex-col overflow-x-hidden bg-background lg:min-h-svh lg:flex-row", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative hidden min-h-[45svh] w-full min-w-0 items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:min-h-svh lg:w-[42%]", children: [
      /* @__PURE__ */ jsx(NeuralVortexBackground, { contained: true }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex w-full min-w-0 max-w-lg items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14", children: /* @__PURE__ */ jsx(AuthScannerPanel, {}) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative flex min-h-svh w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f4f7fb] lg:min-h-svh lg:w-[58%]", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute right-0 top-0 h-72 w-72 max-w-[50%] translate-x-1/4 rounded-full bg-cyan-300/15 blur-3xl" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute bottom-0 left-0 h-56 w-56 max-w-[50%] rounded-full bg-cyan-300/10 blur-3xl" }),
      /* @__PURE__ */ jsx("header", { className: "relative z-10 flex shrink-0 justify-end px-5 py-4 sm:px-10 lg:px-14", children: /* @__PURE__ */ jsxs("div", { className: "text-right text-sm leading-relaxed", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-[#1e3a5f]", children: "Need help?" }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: `mailto:${LEGAL_CONTACT_EMAIL}`,
            className: "block font-medium text-primary transition-colors hover:text-primary/80",
            children: LEGAL_CONTACT_EMAIL
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: `tel:${LEGAL_CONTACT_PHONE}`,
            className: "block font-medium text-primary transition-colors hover:text-primary/80",
            children: LEGAL_CONTACT_PHONE
          }
        )
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-10 sm:px-10 lg:px-14 lg:py-14", children: /* @__PURE__ */ jsx("div", { className: "w-full min-w-0 max-w-xl sm:max-w-2xl lg:max-w-2xl", children: mode === "forgot-password" ? /* @__PURE__ */ jsx(ForgotPasswordForm, {}) : mode === "access-denied" ? /* @__PURE__ */ jsx(AccessDeniedPanel, {}) : /* @__PURE__ */ jsx(AuthCredentialsForm, { mode }) }) }),
      /* @__PURE__ */ jsxs("footer", { className: "relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 text-center text-md text-[#1e3a5f] sm:px-10 lg:px-14", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: LEGAL_PAGE_URLS.privacy,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "transition-colors hover:text-foreground",
            children: "Privacy Policy"
          }
        ),
        /* @__PURE__ */ jsx("span", { "aria-hidden": true, className: "text-border", children: "·" }),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: LEGAL_PAGE_URLS.terms,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "transition-colors hover:text-foreground",
            children: "Terms & Conditions"
          }
        )
      ] })
    ] })
  ] });
}
function AuthRoute() {
  const {
    pathname
  } = Route.useParams();
  return /* @__PURE__ */ jsx(AuthPage, { pathname });
}
export {
  AuthRoute as component
};
