"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const { language } = useLanguage();
  const vi = language !== "en";
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8 || !/[A-Za-zÀ-ỹ]/.test(pw) || !/\d/.test(pw)) {
      return setError(vi ? "Mật khẩu cần tối thiểu 8 ký tự, gồm chữ và số." : "Use at least 8 characters with letters and numbers.");
    }
    if (pw !== pw2) return setError(vi ? "Mật khẩu xác nhận không khớp." : "Passwords do not match.");
    setBusy(true);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: params.get("email"), token: params.get("token"), password: pw }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    setBusy(false);
    if (!data?.success) {
      return setError(vi ? data?.error || "Liên kết không hợp lệ." : "This link is invalid or has expired.");
    }
    await refresh();
    router.push("/account");
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-md w-full border border-neutral-200 p-8 space-y-4">
      <KeyRound className="w-8 h-8 mx-auto text-[#C5A880]" />
      <h1 className="font-serif text-2xl text-center">{vi ? "Đặt lại mật khẩu" : "Reset password"}</h1>
      {[{ v: pw, s: setPw, l: vi ? "Mật khẩu mới" : "New password" }, { v: pw2, s: setPw2, l: vi ? "Nhập lại" : "Confirm" }].map((f) => (
        <label key={f.l} className="block text-[11px] uppercase tracking-wider font-semibold">
          {f.l}
          <input
            type="password"
            autoComplete="new-password"
            value={f.v}
            onChange={(e) => f.s(e.target.value)}
            className="mt-1 w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 text-sm normal-case font-normal"
          />
        </label>
      ))}
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="w-full py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold disabled:opacity-60">
        {vi ? "Lưu mật khẩu" : "Save password"}
      </button>
      <p className="text-center text-xs"><Link href="/forgot-password" className="underline">{vi ? "Gửi lại liên kết" : "Send a new link"}</Link></p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
