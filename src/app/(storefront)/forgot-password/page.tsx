"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

/**
 * Password reset request. With SMTP configured the server emails a one-time
 * link (30 min). Without SMTP the shop resets it in Admin → Users, so the page
 * tells the customer how to reach the shop.
 */
export default function ForgotPasswordPage() {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const vi = language !== "en";
  const contact = [settings.hotline, settings.email].filter(Boolean).join(" · ");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "nomail" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setState("error");
    setState("sending");
    const res = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (!data?.success) return setState("error");
    setState(data.emailEnabled ? "sent" : "nomail");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full border border-neutral-200 p-8 space-y-4" data-testid="forgot">
          <KeyRound className="w-8 h-8 mx-auto text-[#C5A880]" />
          <h1 className="font-serif text-2xl text-center">{vi ? "Quên mật khẩu" : "Forgot password"}</h1>
          {state === "sent" ? (
            <p role="status" className="text-sm text-neutral-700 text-center leading-relaxed">
              {vi
                ? "Nếu email có tài khoản, chúng tôi đã gửi liên kết đặt lại mật khẩu (hiệu lực 30 phút). Hãy kiểm tra cả hộp thư rác."
                : "If that email has an account, we've sent a reset link (valid 30 minutes). Please check your spam folder too."}
            </p>
          ) : state === "nomail" ? (
            <p role="status" className="text-sm text-neutral-700 text-center leading-relaxed">
              {vi
                ? "Cửa hàng chưa bật gửi email tự động. Vui lòng liên hệ EVERIE để được cấp lại mật khẩu"
                : "Automatic email isn't enabled yet. Please contact EVERIE and we'll reset your password"}
              {contact ? ` (${contact})` : ""}.
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-3">
              <p className="text-sm text-neutral-600 text-center">
                {vi ? "Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu." : "Enter your account email and we'll send you a reset link."}
              </p>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:outline-hidden focus:border-black"
              />
              {state === "error" && (
                <p role="alert" className="text-xs text-red-600">
                  {vi ? "Email không hợp lệ hoặc gửi quá nhiều lần." : "Invalid email or too many attempts."}
                </p>
              )}
              <button
                type="submit"
                disabled={state === "sending"}
                className="w-full py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold disabled:opacity-60"
              >
                {vi ? "Gửi liên kết" : "Send link"}
              </button>
            </form>
          )}
          <div className="flex justify-center gap-4 pt-2 text-xs uppercase tracking-widest">
            <Link href="/login" className="underline">{vi ? "Đăng nhập" : "Sign in"}</Link>
            <Link href="/lookup" className="underline">{vi ? "Tra cứu đơn" : "Track order"}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
