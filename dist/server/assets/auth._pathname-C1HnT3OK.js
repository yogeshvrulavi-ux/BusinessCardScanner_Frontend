import { jsxs, jsx } from "react/jsx-runtime";
import * as React from "react";
import { forwardRef, useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EyeOff, Eye, Loader2, Minus, ScanLine, Zap } from "lucide-react";
import { toast } from "sonner";
import { e as cn, f as authClient, a5 as resolvePostAuthPath, a6 as AppLogo, a7 as clearAuthTokenCache, i as invalidateContactsDirectory, s as syncProfileFromAuthUser, n as saveUserSettings, a8 as neonAuthConfigIssue, a9 as neonAuthUrl, A as API_BASE_URL, aa as useForceLightMode, ab as Route } from "./router-CElpkivw.js";
import { OTPInput, OTPInputContext } from "input-otp";
import { a as LEGAL_CONTACT_EMAIL, b as LEGAL_CONTACT_PHONE, L as LEGAL_PAGE_URLS } from "./legalContent-W3nnvv-x.js";
import "@tanstack/react-query";
import "@neondatabase/auth-ui";
import "@neondatabase/neon-js/auth";
import "@neondatabase/neon-js/auth/react";
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
const AuthField = forwardRef(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: inputId, className: "text-sm font-medium text-[#1e3a5f]/90", children: label }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ref,
          id: inputId,
          className: cn(
            "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-foreground outline-none transition-all",
            "placeholder:text-muted-foreground/60",
            "focus:border-primary/50 focus:bg-white focus:ring-2 focus:ring-primary/15",
            error && "border-destructive/70 focus:border-destructive focus:ring-destructive/15",
            className
          ),
          ...props
        }
      ),
      error ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: error }) : null
    ] });
  }
);
AuthField.displayName = "AuthField";
const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional()
});
const signUpSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(8, "Enter a valid phone number").max(20, "Phone number is too long").regex(/^[\d+\s().-]+$/, "Use digits and + ( ) - only"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});
const copy = {
  "sign-in": {
    title: "Welcome back",
    subtitle: "Sign in to continue scanning and syncing contacts.",
    submit: "Log in",
    footer: { text: "Don't have an account?", linkText: "Sign up", pathname: "sign-up" }
  },
  "sign-up": {
    title: "Create account",
    subtitle: "Get started in under a minute — no credit card required.",
    submit: "Create account",
    footer: { text: "Already have an account?", linkText: "Log in", pathname: "sign-in" }
  }
};
function extractErrorMessage(error) {
  if (error && typeof error === "object") {
    const record = error;
    const message = record.error?.message ?? record.message ?? "";
    if (/failed to fetch|networkerror|name not resolved|err_name_not_resolved/i.test(message)) {
      const hint = neonAuthConfigIssue ? neonAuthConfigIssue : `Current auth URL: ${neonAuthUrl || "(not set)"}. Restart \`npm run dev\` after editing frontend/.env.`;
      return `Cannot reach Neon Auth (sign-up uses Neon, not Brevo). ${hint}`;
    }
    if (record.error?.message) return record.error.message;
    if (record.message) return record.message;
  }
  return "Something went wrong. Please try again.";
}
function AuthCredentialsForm({ mode }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", rememberMe: true }
  });
  const signUpForm = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" }
  });
  const { data: session, isPending } = authClient.useSession();
  useEffect(() => {
    if (!isPending && session?.user) {
      navigate({ to: resolvePostAuthPath(), replace: true });
    }
  }, [isPending, session?.user, navigate]);
  const onSignIn = async (values) => {
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
        rememberMe: values.rememberMe ?? true,
        callbackURL: "/scan"
      });
      if (result.error) {
        toast.error(extractErrorMessage(result.error));
        return;
      }
      clearAuthTokenCache();
      invalidateContactsDirectory();
      syncProfileFromAuthUser({ email: values.email.trim() });
      toast.success("Welcome back!");
      const session2 = await authClient.getSession();
      if (session2.data?.user) {
        syncProfileFromAuthUser(session2.data.user);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  const onSignUp = async (values) => {
    setSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        callbackURL: "/scan"
      });
      if (result.error) {
        toast.error(extractErrorMessage(result.error));
        return;
      }
      clearAuthTokenCache();
      invalidateContactsDirectory();
      syncProfileFromAuthUser({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim()
      });
      saveUserSettings({ phone: values.phone.trim() });
      toast.success("Account created! You're signed in.");
      const session2 = await authClient.getSession();
      if (session2.data?.user) {
        syncProfileFromAuthUser(session2.data.user);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  const content = copy[mode];
  return /* @__PURE__ */ jsxs("div", { className: "mx-auto w-full min-w-0 max-w-lg rounded-2xl bg-white px-6 py-8 shadow-sm sm:px-8 sm:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(AppLogo, { size: "md" }),
      /* @__PURE__ */ jsxs("div", { className: "leading-tight", children: [
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "CardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Scan · Detect · Extract" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-7 space-y-1.5", children: [
      /* @__PURE__ */ jsx("h1", { className: "font-display text-2xl font-bold tracking-tight text-[#1e3a5f] sm:text-3xl", children: content.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed text-muted-foreground", children: content.subtitle })
    ] }),
    mode === "sign-in" ? /* @__PURE__ */ jsxs("form", { className: "space-y-5", onSubmit: signInForm.handleSubmit(onSignIn), noValidate: true, children: [
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@company.com",
          error: signInForm.formState.errors.email?.message,
          ...signInForm.register("email")
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Password",
            type: showPassword ? "text" : "password",
            autoComplete: "current-password",
            placeholder: "••••••••",
            error: signInForm.formState.errors.password?.message,
            className: "pr-11",
            ...signInForm.register("password")
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute right-3 top-[2.125rem] text-muted-foreground transition-colors hover:text-foreground",
            onClick: () => setShowPassword((v) => !v),
            "aria-label": showPassword ? "Hide password" : "Show password",
            children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
          }
        )
      ] }),
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
      /* @__PURE__ */ jsx(SubmitButton$1, { loading: submitting, label: content.submit })
    ] }) : null,
    mode === "sign-up" ? /* @__PURE__ */ jsxs("form", { className: "space-y-4", onSubmit: signUpForm.handleSubmit(onSignUp), noValidate: true, children: [
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Full name",
          autoComplete: "name",
          placeholder: "Jane Smith",
          error: signUpForm.formState.errors.name?.message,
          ...signUpForm.register("name")
        }
      ),
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Email",
          type: "email",
          autoComplete: "email",
          placeholder: "you@company.com",
          error: signUpForm.formState.errors.email?.message,
          ...signUpForm.register("email")
        }
      ),
      /* @__PURE__ */ jsx(
        AuthField,
        {
          label: "Phone number",
          type: "tel",
          autoComplete: "tel",
          placeholder: "+91 98765 43210",
          error: signUpForm.formState.errors.phone?.message,
          ...signUpForm.register("phone")
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Password",
            type: showPassword ? "text" : "password",
            autoComplete: "new-password",
            placeholder: "At least 8 characters",
            error: signUpForm.formState.errors.password?.message,
            className: "pr-11",
            ...signUpForm.register("password")
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute right-3 top-[2.125rem] text-muted-foreground transition-colors hover:text-foreground",
            onClick: () => setShowPassword((v) => !v),
            "aria-label": showPassword ? "Hide password" : "Show password",
            children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(
          AuthField,
          {
            label: "Confirm password",
            type: showConfirm ? "text" : "password",
            autoComplete: "new-password",
            placeholder: "Repeat password",
            error: signUpForm.formState.errors.confirmPassword?.message,
            className: "pr-11",
            ...signUpForm.register("confirmPassword")
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "absolute right-3 top-[2.125rem] text-muted-foreground transition-colors hover:text-foreground",
            onClick: () => setShowConfirm((v) => !v),
            "aria-label": showConfirm ? "Hide password" : "Show password",
            children: showConfirm ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsx(SubmitButton$1, { loading: submitting, label: content.submit })
    ] }) : null,
    content.footer ? /* @__PURE__ */ jsxs("p", { className: "mt-7 text-center text-sm text-muted-foreground", children: [
      content.footer.text,
      " ",
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/auth/$pathname",
          params: { pathname: content.footer.pathname },
          className: "font-semibold text-primary transition-colors hover:text-primary/80",
          children: content.footer.linkText
        }
      )
    ] }) : null
  ] });
}
function SubmitButton$1({ loading, label }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "submit",
      disabled: loading,
      className: cn(
        "mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all",
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
        /* @__PURE__ */ jsx("div", { className: "font-display text-lg font-semibold tracking-tight text-[#1e3a5f]", children: "CardScan" }),
        /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground", children: "Scan · Detect · Extract" })
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
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              AuthField,
              {
                label: "New password",
                type: showPassword ? "text" : "password",
                autoComplete: "new-password",
                placeholder: "At least 8 characters",
                error: resetForm.formState.errors.password?.message,
                className: "pr-11",
                ...resetForm.register("password")
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "absolute right-3 top-[2.125rem] text-muted-foreground transition-colors hover:text-foreground",
                onClick: () => setShowPassword((v) => !v),
                "aria-label": showPassword ? "Hide password" : "Show password",
                children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(
              AuthField,
              {
                label: "Confirm new password",
                type: showConfirm ? "text" : "password",
                autoComplete: "new-password",
                placeholder: "Repeat new password",
                error: resetForm.formState.errors.confirmPassword?.message,
                className: "pr-11",
                ...resetForm.register("confirmPassword")
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "absolute right-3 top-[2.125rem] text-muted-foreground transition-colors hover:text-foreground",
                onClick: () => setShowConfirm((v) => !v),
                "aria-label": showConfirm ? "Hide password" : "Show password",
                children: showConfirm ? /* @__PURE__ */ jsx(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
              }
            )
          ] }),
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
        "mt-1 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition-all",
        "hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      ),
      children: loading ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : label
    }
  );
}
const stats = [
  { label: "Name", value: "98%" },
  { label: "Email", value: "94%" },
  { label: "Phone", value: "96%" }
];
function AuthScannerPanel() {
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg min-w-0 px-2 py-6 sm:px-4 sm:py-8 lg:px-6 lg:py-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center sm:text-left", children: [
      /* @__PURE__ */ jsxs("h2", { className: "font-display text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl", children: [
        "Turn business cards",
        /* @__PURE__ */ jsx("span", { className: "block bg-gradient-to-r from-cyan-300 via-violet-300 to-violet-400 bg-clip-text text-transparent", children: "into CRM leads" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 max-w-sm text-sm leading-relaxed text-white/60", children: "Scan at events, review on-device, and sync to Zoho — built for networking teams." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-3 flex items-center gap-2 text-xs text-white/70", children: [
        /* @__PURE__ */ jsx(ScanLine, { className: "h-3.5 w-3.5 text-cyan-300" }),
        /* @__PURE__ */ jsx("span", { children: "Live scanning preview" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative aspect-[1.6/1] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#0f172a]", children: [
        [
          "top-2 left-2 border-l-2 border-t-2",
          "top-2 right-2 border-r-2 border-t-2",
          "bottom-2 left-2 border-l-2 border-b-2",
          "bottom-2 right-2 border-r-2 border-b-2"
        ].map((position) => /* @__PURE__ */ jsx("div", { className: cn("absolute h-4 w-4 border-cyan-400/80", position) }, position)),
        /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "animate-scan-line absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/35 to-transparent" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-3 grid grid-cols-3 gap-2", children: stats.map((stat) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-center",
          children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold text-white", children: stat.value }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-white/50", children: stat.label })
          ]
        },
        stat.label
      )) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap justify-center gap-2 sm:justify-start", children: ["On-device OCR", "Zoho sync", "Offline queue"].map((feature) => /* @__PURE__ */ jsxs(
      "span",
      {
        className: "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/65",
        children: [
          /* @__PURE__ */ jsx(Zap, { className: "h-3 w-3 text-violet-300" }),
          feature
        ]
      },
      feature
    )) })
  ] });
}
const VERTEX_SHADER = `
  precision mediump float;
  attribute vec2 a_position;
  varying vec2 vUv;
  void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;
const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vUv;
  uniform float u_time;
  uniform float u_ratio;
  uniform vec2 u_pointer_position;
  uniform float u_scroll_progress;

  vec2 rotate(vec2 uv, float th) {
    return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
  }

  float neuro_shape(vec2 uv, float t, float p) {
    vec2 sine_acc = vec2(0.);
    vec2 res = vec2(0.);
    float scale = 8.;
    for (int j = 0; j < 15; j++) {
      uv = rotate(uv, 1.);
      sine_acc = rotate(sine_acc, 1.);
      vec2 layer = uv * scale + float(j) + sine_acc - t;
      sine_acc += sin(layer) + 2.4 * p;
      res += (.5 + .5 * cos(layer)) / scale;
      scale *= 1.2;
    }
    return res.x + res.y;
  }

  void main() {
    vec2 uv = .5 * vUv;
    uv.x *= u_ratio;
    vec2 pointer = vUv - u_pointer_position;
    pointer.x *= u_ratio;
    float p = clamp(length(pointer), 0., 1.);
    p = .5 * pow(1. - p, 2.);
    float t = .001 * u_time;
    float noise = neuro_shape(uv, t, p);
    noise = 1.15 * pow(noise, 2.8);
    noise += pow(noise, 8.) * 0.85;
    noise = max(.0, noise - .42);
    noise *= (1. - length(vUv - .5) * 0.85);

    // Dark base + CardSync cyan + two violet glows
    vec3 baseDark = vec3(0.03, 0.05, 0.12);
    vec3 violet = vec3(0.62, 0.28, 0.95);
    vec3 violetDeep = vec3(0.38, 0.12, 0.72);
    vec3 cyan = vec3(0.10, 0.58, 0.88);

    vec3 glow = mix(violetDeep, mix(violet, cyan, 0.42 + 0.2 * sin(2.0 * u_scroll_progress + 1.2)), noise);
    glow += violet * (0.15 + 0.08 * sin(2.0 * u_scroll_progress + 1.5));
    vec3 color = baseDark + glow * noise * 1.65;

    float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 0.65;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
function compileShader(gl, source, type) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function NeuralVortexBackground({ className, contained = true }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const pointer = useRef({ x: 0, y: 0, tX: 0, tY: 0 });
  const animationRef = useRef(0);
  useEffect(() => {
    const canvasEl = canvasRef.current;
    const rootEl = rootRef.current;
    if (!canvasEl) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;
    const gl = canvasEl.getContext("webgl") ?? canvasEl.getContext("experimental-webgl");
    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      console.error("WebGL not supported");
      return;
    }
    const vertexShader = compileShader(gl, VERTEX_SHADER, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, FRAGMENT_SHADER, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    const uTime = gl.getUniformLocation(program, "u_time");
    const uRatio = gl.getUniformLocation(program, "u_ratio");
    const uPointerPosition = gl.getUniformLocation(program, "u_pointer_position");
    const uScrollProgress = gl.getUniformLocation(program, "u_scroll_progress");
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const getBounds = () => {
      if (contained && rootEl) {
        return rootEl.getBoundingClientRect();
      }
      return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
    };
    const resizeCanvas = () => {
      const bounds = getBounds();
      const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(bounds.width * devicePixelRatio));
      const height = Math.max(1, Math.floor(bounds.height * devicePixelRatio));
      canvasEl.width = width;
      canvasEl.height = height;
      canvasEl.style.width = `${bounds.width}px`;
      canvasEl.style.height = `${bounds.height}px`;
      gl.viewport(0, 0, width, height);
      gl.uniform1f(uRatio, width / height);
    };
    resizeCanvas();
    const render = () => {
      const bounds = getBounds();
      pointer.current.x += (pointer.current.tX - pointer.current.x) * 0.2;
      pointer.current.y += (pointer.current.tY - pointer.current.y) * 0.2;
      gl.uniform1f(uTime, performance.now());
      gl.uniform2f(
        uPointerPosition,
        (pointer.current.x - bounds.left) / bounds.width,
        1 - (pointer.current.y - bounds.top) / bounds.height
      );
      gl.uniform1f(uScrollProgress, window.pageYOffset / (2 * window.innerHeight));
      gl.clearColor(0.03, 0.05, 0.12, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationRef.current = requestAnimationFrame(render);
    };
    render();
    const handlePointerMove = (e) => {
      pointer.current.tX = e.clientX;
      pointer.current.tY = e.clientY;
    };
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("pointermove", handlePointerMove);
    const observer = contained && rootEl ? new ResizeObserver(resizeCanvas) : null;
    observer?.observe(rootEl);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("pointermove", handlePointerMove);
      observer?.disconnect();
      cancelAnimationFrame(animationRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, [contained]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: rootRef,
      className: cn("absolute inset-0 overflow-hidden bg-[#070b14]", className),
      children: /* @__PURE__ */ jsx("canvas", { ref: canvasRef, className: "pointer-events-none absolute inset-0 h-full w-full", "aria-hidden": true })
    }
  );
}
async function checkNeonAuthHealth() {
  const base = neonAuthUrl.replace(/\/$/, "");
  if (!base) {
    return { ok: false, reason: "missing_url", detail: "VITE_NEON_AUTH_URL is not set." };
  }
  try {
    const response = await fetch(`${base}/reference`, { method: "GET" });
    if (response.ok) return { ok: true };
    if (response.status === 404) {
      return {
        ok: false,
        reason: "not_enabled",
        detail: "Neon Auth returned 404. In Neon Console open your project → Auth → Enable Neon Auth, then copy the Auth URL exactly into VITE_NEON_AUTH_URL and restart npm run dev."
      };
    }
    return {
      ok: false,
      reason: "unreachable",
      detail: `Neon Auth check failed (${response.status}). Verify the Auth URL in Neon Console → Auth.`
    };
  } catch {
    return {
      ok: false,
      reason: "unreachable",
      detail: "Cannot reach Neon Auth. Check VITE_NEON_AUTH_URL and your network connection."
    };
  }
}
function normalizeMode(pathname) {
  if (pathname === "sign-up") return "sign-up";
  if (pathname === "forgot-password") return "forgot-password";
  return "sign-in";
}
function AuthPage({ pathname }) {
  const mode = normalizeMode(pathname);
  useForceLightMode(true);
  const [authHealthMessage, setAuthHealthMessage] = useState(null);
  useEffect(() => {
    if (neonAuthConfigIssue) return;
    checkNeonAuthHealth().then((status) => {
      if (!status.ok) setAuthHealthMessage(status.detail);
    });
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: "light flex min-h-svh w-full max-w-[100vw] flex-col overflow-x-hidden bg-background lg:min-h-svh lg:flex-row", children: [
    /* @__PURE__ */ jsxs("section", { className: "relative hidden min-h-[45svh] w-full min-w-0 items-center justify-center overflow-hidden bg-[#070b14] lg:flex lg:min-h-svh lg:w-[42%]", children: [
      /* @__PURE__ */ jsx(NeuralVortexBackground, { contained: true }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_0%,#070b14_75%)]" }),
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex w-full min-w-0 max-w-lg items-center justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14", children: /* @__PURE__ */ jsx(AuthScannerPanel, {}) })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "relative flex min-h-svh w-full min-w-0 flex-1 flex-col overflow-x-hidden bg-[#f4f7fb] lg:min-h-svh lg:w-[58%]", children: [
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute inset-0 bg-gradient-surface opacity-50" }),
      /* @__PURE__ */ jsx("div", { className: "pointer-events-none absolute right-0 top-0 h-72 w-72 max-w-[50%] translate-x-1/4 rounded-full bg-violet-300/15 blur-3xl" }),
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
      /* @__PURE__ */ jsx("div", { className: "relative z-10 flex flex-1 items-center justify-center overflow-y-auto px-5 py-10 sm:px-10 lg:px-14 lg:py-14", children: /* @__PURE__ */ jsxs("div", { className: "w-full min-w-0 max-w-xl sm:max-w-2xl lg:max-w-2xl", children: [
        neonAuthConfigIssue ? /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900", children: neonAuthConfigIssue }) : null,
        authHealthMessage ? /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900", children: authHealthMessage }) : null,
        mode === "forgot-password" ? /* @__PURE__ */ jsx(ForgotPasswordForm, {}) : /* @__PURE__ */ jsx(AuthCredentialsForm, { mode })
      ] }) }),
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
