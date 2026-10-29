"use client";

import { useEffect, useReducer } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LoaderCircle,
  LogIn,
  Mail,
  RefreshCw,
  TriangleAlert,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/atoms/button";
import { getSupabaseBrowserClient } from "@/features/artwork/infrastructure/supabase/supabase-clients";
import {
  buildAuthRedirectUrl,
  parseAuthCallbackHash,
  PENDING_SIGNUP_EMAIL_KEY,
  PENDING_SIGNUP_NEXT_PATH_KEY,
  sanitizeNextPath,
} from "@/features/auth/domain/auth-confirmation";
import {
  authFormSchema,
  type AuthFormValues,
} from "@/features/auth/domain/auth-form-schema";

interface AuthFormProps {
  nextPath?: string;
}

type ConfirmationRecoveryState = {
  status: "idle" | "expired" | "error" | "resending" | "resent";
  message: string | null;
};

function confirmationRecoveryReducer(
  _state: ConfirmationRecoveryState,
  nextState: ConfirmationRecoveryState,
): ConfirmationRecoveryState {
  return nextState;
}

function clearAuthHash() {
  if (!window.location.hash) return;

  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
}

export function AuthForm({ nextPath }: AuthFormProps) {
  const router = useRouter();
  const redirectPath = sanitizeNextPath(nextPath);
  const [confirmationRecovery, dispatchConfirmationRecovery] = useReducer(
    confirmationRecoveryReducer,
    { status: "idle", message: null },
  );
  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authFormSchema),
    defaultValues: {
      mode: "signin",
      email: "",
      password: "",
    },
  });

  const mode = useWatch({ control, name: "mode" });
  const serverMessage = errors.root?.server?.message;
  const successMessage = errors.root?.success?.message;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const pendingEmail = window.localStorage.getItem(PENDING_SIGNUP_EMAIL_KEY);
    const callback = parseAuthCallbackHash(window.location.hash);
    let active = true;
    let redirected = false;

    if (pendingEmail) {
      setValue("email", pendingEmail, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });
    }

    if (callback.kind === "expired") {
      dispatchConfirmationRecovery({
        status: "expired",
        message:
          "Link xác nhận email đã hết hạn hoặc không còn hợp lệ. Hãy gửi một link mới và chỉ sử dụng email xác nhận mới nhất.",
      });
      clearAuthHash();
    } else if (callback.kind === "error") {
      dispatchConfirmationRecovery({
        status: "error",
        message:
          "Không thể xác nhận email bằng link này. Bạn có thể gửi lại email xác nhận để nhận một link mới.",
      });
      clearAuthHash();
    }

    function finishAuthenticatedSession() {
      if (!active || redirected) return;
      redirected = true;
      window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
      window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
      clearAuthHash();
      router.replace(redirectPath);
      router.refresh();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) finishAuthenticatedSession();
    });

    if (callback.kind !== "expired" && callback.kind !== "error") {
      void supabase.auth.getSession().then(({ data, error }) => {
        if (!active) return;

        if (data.session?.user) {
          finishAuthenticatedSession();
          return;
        }

        if (error && callback.kind === "success") {
          dispatchConfirmationRecovery({
            status: "error",
            message:
              "Email đã được mở nhưng phiên đăng nhập không thể được tạo. Hãy gửi lại email xác nhận và thử với link mới nhất.",
          });
          clearAuthHash();
        }
      });
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [redirectPath, router, setValue]);

  function changeMode(nextMode: AuthFormValues["mode"]) {
    setValue("mode", nextMode, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
    clearErrors();
  }

  async function resendConfirmation() {
    clearErrors("root");

    const emailIsValid = await trigger("email");
    if (!emailIsValid) return;

    const email = getValues("email").trim();
    dispatchConfirmationRecovery({
      status: "resending",
      message: "Đang gửi email xác nhận mới…",
    });

    try {
      const supabase = getSupabaseBrowserClient();
      const emailRedirectTo = buildAuthRedirectUrl(window.location.origin, redirectPath);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo },
      });

      if (error) throw error;

      window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
      window.localStorage.setItem(PENDING_SIGNUP_NEXT_PATH_KEY, redirectPath);
      dispatchConfirmationRecovery({
        status: "resent",
        message:
          "Đã gửi email xác nhận mới. Hãy mở email mới nhất; các link xác nhận cũ có thể không còn hợp lệ.",
      });
    } catch (cause) {
      dispatchConfirmationRecovery({
        status: "error",
        message:
          cause instanceof Error
            ? cause.message
            : "Không thể gửi lại email xác nhận. Vui lòng thử lại.",
      });
    }
  }

  const submit = handleSubmit(async ({ email, password, mode: submitMode }) => {
    clearErrors("root");

    try {
      const supabase = getSupabaseBrowserClient();

      if (submitMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      const emailRedirectTo = buildAuthRedirectUrl(window.location.origin, redirectPath);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      if (error) throw error;

      if (data.session) {
        window.localStorage.removeItem(PENDING_SIGNUP_EMAIL_KEY);
        window.localStorage.removeItem(PENDING_SIGNUP_NEXT_PATH_KEY);
        router.replace(redirectPath);
        router.refresh();
        return;
      }

      window.localStorage.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
      window.localStorage.setItem(PENDING_SIGNUP_NEXT_PATH_KEY, redirectPath);
      dispatchConfirmationRecovery({ status: "idle", message: null });
      setError("root.success", {
        type: "success",
        message:
          "Tài khoản đã được tạo. Hãy kiểm tra email và mở link xác nhận mới nhất để hoàn tất đăng ký.",
      });
    } catch (cause) {
      setError("root.server", {
        type: "server",
        message:
          cause instanceof Error ? cause.message : "Không thể xác thực tài khoản.",
      });
    }
  });

  const showRecovery = confirmationRecovery.status !== "idle";
  const recoverySucceeded = confirmationRecovery.status === "resent";
  const recoveryPending = confirmationRecovery.status === "resending";

  return (
    <div className="auth-card relative mt-10 w-full overflow-hidden rounded-[8px] bg-[#0d0a14]/76 shadow-[0_34px_110px_rgba(0,0,0,0.5)] ring-1 ring-inset ring-white/[0.07] backdrop-blur-2xl">
      <div className="auth-card-glow" />

      <div className="auth-mode-switch relative grid grid-cols-2">
        <span
          aria-hidden="true"
          className={`auth-mode-indicator ${mode === "signup" ? "is-signup" : ""}`}
        />
        <button
          type="button"
          onClick={() => changeMode("signin")}
          aria-pressed={mode === "signin"}
          className={`relative z-10 px-4 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition ${
            mode === "signin" ? "text-white" : "text-white/38 hover:text-white/70"
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => changeMode("signup")}
          aria-pressed={mode === "signup"}
          className={`relative z-10 px-4 py-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition ${
            mode === "signup" ? "text-white" : "text-white/38 hover:text-white/70"
          }`}
        >
          Tạo tài khoản
        </button>
      </div>

      <form className="relative space-y-6 p-5 sm:p-7" onSubmit={submit} noValidate>
        <input type="hidden" {...register("mode")} />

        <label className="auth-field block">
          <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-white/38">Email</span>
          <input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "auth-email-error" : undefined}
            {...register("email")}
            className={`mt-2.5 h-12 w-full rounded-[4px] border bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-white/20 ${
              errors.email
                ? "border-rose-300/45"
                : "border-white/12 hover:border-white/22 focus:border-violet-300/60"
            }`}
            placeholder="you@example.com"
          />
          {errors.email?.message ? (
            <p id="auth-email-error" className="auth-error mt-2 text-xs text-rose-200/80">
              {errors.email.message}
            </p>
          ) : null}
        </label>

        {showRecovery ? (
          <div
            className={`auth-message rounded-[5px] border p-4 text-sm leading-6 ${
              recoverySucceeded
                ? "border-emerald-300/15 bg-emerald-300/[0.055] text-emerald-100/80"
                : "border-amber-300/15 bg-amber-300/[0.055] text-amber-100/80"
            }`}
          >
            <div className="flex items-start gap-3">
              {recoverySucceeded ? (
                <Mail className="mt-1 size-4 shrink-0" aria-hidden="true" />
              ) : recoveryPending ? (
                <LoaderCircle className="mt-1 size-4 shrink-0 animate-spin" aria-hidden="true" />
              ) : (
                <TriangleAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {recoverySucceeded
                    ? "Email xác nhận mới đã được gửi"
                    : recoveryPending
                      ? "Đang gửi lại email"
                      : "Link xác nhận đã hết hạn"}
                </p>
                {confirmationRecovery.message ? (
                  <p className="mt-1 text-xs leading-5 opacity-75">{confirmationRecovery.message}</p>
                ) : null}
              </div>
            </div>
            {!recoverySucceeded ? (
              <button
                type="button"
                disabled={recoveryPending}
                onClick={() => void resendConfirmation()}
                className="mt-3 inline-flex items-center gap-2 border-b border-current pb-0.5 text-xs font-medium disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshCw className={`size-3.5 ${recoveryPending ? "animate-spin" : ""}`} aria-hidden="true" />
                {recoveryPending ? "Đang gửi…" : "Gửi link mới"}
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="auth-field block">
          <span className="block text-[0.62rem] uppercase tracking-[0.18em] text-white/38">Mật khẩu</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "auth-password-error" : undefined}
            {...register("password")}
            className={`mt-2.5 h-12 w-full rounded-[4px] border bg-white/[0.025] px-3.5 text-sm text-white outline-none transition placeholder:text-white/20 ${
              errors.password
                ? "border-rose-300/45"
                : "border-white/12 hover:border-white/22 focus:border-violet-300/60"
            }`}
            placeholder="Tối thiểu 6 ký tự"
          />
          {errors.password?.message ? (
            <p id="auth-password-error" className="auth-error mt-2 text-xs text-rose-200/80">
              {errors.password.message}
            </p>
          ) : null}
        </label>

        {serverMessage ? (
          <p className="auth-error rounded-[5px] border border-rose-300/15 bg-rose-300/[0.05] px-4 py-3 text-sm leading-6 text-rose-100/80">
            {serverMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="auth-message rounded-[5px] border border-emerald-300/15 bg-emerald-300/[0.05] px-4 py-3 text-sm leading-6 text-emerald-100/80">
            {successMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`auth-submit-button h-12 w-full rounded-[4px] bg-white text-xs font-semibold uppercase tracking-[0.13em] text-black hover:bg-violet-100 ${
            isSubmitting ? "is-loading" : ""
          }`}
        >
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : mode === "signin" ? (
            <LogIn className="size-4" aria-hidden="true" />
          ) : (
            <UserPlus className="size-4" aria-hidden="true" />
          )}
          {isSubmitting ? "Đang xử lý…" : mode === "signin" ? "Đăng nhập" : "Tạo tài khoản"}
        </Button>
      </form>

      <p className="auth-footnote px-5 py-4 text-xs leading-5 text-white/30 sm:px-7">
        Bộ sưu tập đi theo tài khoản của bạn trên mọi thiết bị.
      </p>
    </div>
  );
}
