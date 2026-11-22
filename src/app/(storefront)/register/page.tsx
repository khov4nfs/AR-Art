"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Package, Heart, PenLine } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { isValidVnPhone } from "@/lib/everie";

const COPY = {
  vi: {
    eyebrow: "Tài khoản EVERIE",
    side: "Lưu lời khắc, theo dõi tiến độ chế tác và nhận lại tác phẩm của bạn dễ dàng hơn.",
    perks: ["Theo dõi đơn hàng & mã vận đơn", "Lưu sản phẩm yêu thích trên mọi thiết bị", "Lưu địa chỉ, đặt hàng nhanh hơn"],
    title: "Tạo tài khoản",
    sub: "Đăng ký để quản lý đơn hàng và yêu cầu Bespoke.",
    name: "Họ và tên *",
    email: "Email *",
    phone: "Số điện thoại",
    pw: "Mật khẩu *",
    pw2: "Xác nhận mật khẩu *",
    rule: "Tối thiểu 8 ký tự, gồm chữ và số.",
    agree: "Tôi đồng ý với",
    policies: "chính sách của EVERIE",
    submit: "Tạo tài khoản",
    loading: "Đang tạo tài khoản...",
    have: "Đã có tài khoản?",
    login: "Đăng nhập",
    errFill: "Vui lòng điền đủ các trường bắt buộc (*).",
    errMatch: "Mật khẩu xác nhận không khớp.",
    errRule: "Mật khẩu cần tối thiểu 8 ký tự, gồm cả chữ và số.",
    errPhone: "Số điện thoại Việt Nam không hợp lệ.",
    errAgree: "Vui lòng đồng ý với chính sách.",
    ok: "Đã tạo tài khoản và đăng nhập!",
    fail: "Đăng ký thất bại.",
  },
  en: {
    eyebrow: "EVERIE account",
    side: "Keep your engravings, follow crafting progress and track every delivery.",
    perks: ["Track orders & shipping codes", "Wishlist synced across devices", "Saved addresses for faster checkout"],
    title: "Create account",
    sub: "Sign up to manage your orders and bespoke requests.",
    name: "Full name *",
    email: "Email *",
    phone: "Phone",
    pw: "Password *",
    pw2: "Confirm password *",
    rule: "At least 8 characters with letters and numbers.",
    agree: "I agree to",
    policies: "EVERIE's policies",
    submit: "Create account",
    loading: "Creating account...",
    have: "Already have an account?",
    login: "Sign in",
    errFill: "Please fill in all required fields (*).",
    errMatch: "Passwords do not match.",
    errRule: "Password needs at least 8 characters with letters and numbers.",
    errPhone: "Invalid Vietnamese phone number.",
    errAgree: "Please accept the policies.",
    ok: "Account created — you're signed in!",
    fail: "Sign-up failed.",
  },
} as const;

const SERVER_EN: Record<string, string> = {
  "Email đã được đăng ký.": "This email is already registered.",
};

const field =
  "w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors rounded-xs";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { register, lastError, isAuthenticated, ready } = useAuth();
  const { showToast } = useCart();
  const { language } = useLanguage();
  const c = COPY[language === "en" ? "en" : "vi"];
  const next = params.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/admin") ? next : "/account";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && isAuthenticated) router.replace(target);
  }, [ready, isAuthenticated, router, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || !password) return setError(c.errFill);
    if (password.length < 8 || !/[A-Za-zÀ-ỹ]/.test(password) || !/\d/.test(password)) return setError(c.errRule);
    if (password !== confirmPassword) return setError(c.errMatch);
    if (phone.trim() && !isValidVnPhone(phone)) return setError(c.errPhone);
    if (!agree) return setError(c.errAgree);
    setLoading(true);
    const ok = await register(name.trim(), email.trim(), phone.trim(), password);
    setLoading(false);
    if (!ok) {
      const msg = lastError() || c.fail;
      return setError(language === "en" ? SERVER_EN[msg] || msg : msg);
    }
    showToast(c.ok);
    router.push(target);
  };

  return (
    <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-12 border border-neutral-200 overflow-hidden shadow-xl bg-white">
      <div className="lg:col-span-5 bg-[#1a120d] text-[#F3EDE2] p-8 md:p-12 flex flex-col justify-between gap-8">
        <div>
          <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">{c.eyebrow}</span>
          <p className="font-serif italic text-base mt-4 leading-relaxed">{c.side}</p>
        </div>
        <ul className="space-y-3 text-xs font-light text-[#E9D8B4]">
          {[Package, Heart, PenLine].map((Icon, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-[#C5A880] shrink-0" />
              <span>{c.perks[i]}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="lg:col-span-7 p-8 md:p-12">
        <div className="space-y-6 max-w-md mx-auto w-full">
          <div className="text-center space-y-1">
            <h1 className="text-2xl md:text-3xl font-serif uppercase tracking-wide text-black">{c.title}</h1>
            <p className="text-xs text-neutral-500 font-light">{c.sub}</p>
          </div>
          <form onSubmit={handleSubmit} noValidate className="space-y-3.5" data-testid="register-form">
            {[
              { label: c.name, Icon: UserIcon, value: name, set: setName, type: "text", ac: "name", ph: "Nguyễn Văn A" },
              { label: c.email, Icon: Mail, value: email, set: setEmail, type: "email", ac: "email", ph: "email@example.com" },
              { label: c.phone, Icon: Phone, value: phone, set: setPhone, type: "tel", ac: "tel", ph: "0912 345 678" },
              { label: c.pw, Icon: Lock, value: password, set: setPassword, type: "password", ac: "new-password", ph: "••••••••" },
              { label: c.pw2, Icon: Lock, value: confirmPassword, set: setConfirmPassword, type: "password", ac: "new-password", ph: "••••••••" },
            ].map((f, i) => (
              <label key={i} className="block">
                <span className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1">{f.label}</span>
                <span className="relative block">
                  <f.Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type={f.type}
                    autoComplete={f.ac}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.ph}
                    className={field}
                  />
                </span>
              </label>
            ))}
            <p className="text-[11px] text-neutral-500">{c.rule}</p>
            <label className="flex items-start gap-2 text-[11px] text-neutral-600 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="accent-black w-3.5 h-3.5 mt-0.5" />
              <span>
                {c.agree}{" "}
                <Link href="/policies" className="underline text-black font-medium">{c.policies}</Link>
              </span>
            </label>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-[2px] font-bold hover:bg-[#C5A880] hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{loading ? c.loading : c.submit}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="pt-4 text-center border-t border-neutral-100 text-xs text-neutral-600">
            <span>{c.have} </span>
            <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-black font-semibold underline">
              {c.login}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100">
      <Header />
      <main className="flex-1 py-12 md:py-20 px-4 md:px-8">
        <Suspense fallback={null}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
