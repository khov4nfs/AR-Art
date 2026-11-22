"use client";

import React, { useState, Suspense, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

function isAdminRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "CONTENT_EDITOR";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const { login, user, isAuthenticated, logout, lastError } = useAuth();
  const { showToast } = useCart();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  // Already logged in with an explicit return URL → go there if allowed.
  useEffect(() => {
    if (!isAuthenticated || !user || !searchParams.get("next")) return;
    if (!nextPath.startsWith("/admin") || isAdminRole(user.role)) router.replace(nextPath);
  }, [isAuthenticated, user, nextPath, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast(t("auth.fillAll"));
      return;
    }
    setLoading(true);
    const loggedIn = await login(email, password);
    setLoading(false);
    if (!loggedIn) {
      showToast(lastError() || t("auth.loginFail"));
      return;
    }

    const wantsAdmin = nextPath.startsWith("/admin");
    if (wantsAdmin && !isAdminRole(loggedIn.role)) {
      showToast(t("auth.customerNoAdmin"));
      router.push("/");
      return;
    }

    showToast(
      isAdminRole(loggedIn.role) ? t("auth.adminOk") : t("auth.loginOk"),
    );
    // Staff → admin (or the admin page they asked for); customers → return URL or their account.
    const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") && !nextPath.startsWith("/login") ? nextPath : "/";
    if (isAdminRole(loggedIn.role)) router.push(wantsAdmin ? safeNext : safeNext === "/" ? "/admin" : safeNext);
    else router.push(safeNext === "/" ? "/account" : safeNext);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-black dark:text-neutral-100 transition-colors duration-300">
      <Header />

      <main className="flex-1 py-12 md:py-20 px-4 md:px-8">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-xs border border-neutral-200 overflow-hidden shadow-xl bg-white dark:bg-neutral-900 dark:border-neutral-700">
          <div className="lg:col-span-5 relative bg-neutral-900 text-white p-8 md:p-12 flex flex-col justify-between min-h-[380px] lg:min-h-[560px]">
            <Image
              src="/images/hanoia/hero-banner-4.webp"
              alt="EVERIE ceramic craft"
              fill
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover object-center opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="relative z-10">
              <span className="text-xs uppercase tracking-[3px] text-[#C5A880] font-semibold">
                Hanoia Account
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-light uppercase tracking-wide mt-2">
                {t("auth.oneAccount")}
              </h2>
            </div>

            <div className="relative z-10 space-y-4 text-xs font-light text-neutral-300">
              <p className="italic font-serif text-sm text-neutral-200">
                &ldquo;Chúng tôi chế tác sơn mài thượng phẩm, bằng tình yêu và
                niềm kiêu hãnh từ nền thủ công tinh xảo của Việt Nam.&rdquo;
              </p>
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                  <span>{t("auth.perkCustomer")}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                  <span>{t("auth.perkAdmin")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
            {isAuthenticated && user ? (
              <div className="space-y-6 text-center max-w-sm mx-auto">
                <h1 className="text-2xl font-serif uppercase tracking-wide">
                  {t("auth.hello", { name: user.name })}
                </h1>
                <p className="text-xs text-neutral-500">
                  {user.email}
                  {isAdminRole(user.role) ? ` · ${t("auth.adminBadge")}` : ""}
                </p>
                {nextPath.startsWith("/admin") && !isAdminRole(user.role) && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xs">
                    {t("auth.switchAdmin")}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {isAdminRole(user.role) && (
                    <Link
                      href="/admin"
                      className="px-6 py-3 bg-black text-white text-xs uppercase tracking-wider font-semibold hover:bg-[#C5A880] hover:text-black transition-colors"
                    >
                      {t("auth.goAdmin")}
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="px-6 py-3 border border-neutral-300 text-xs uppercase tracking-wider font-semibold hover:border-black transition-colors"
                  >
                    {t("auth.goShop")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      showToast(t("auth.logoutOk"));
                    }}
                    className="px-6 py-3 text-xs uppercase tracking-wider text-red-600 underline cursor-pointer"
                  >
                    {t("header.logout")}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 max-w-md mx-auto w-full">
                <div className="space-y-1 mb-2">
                  <h1 className="text-2xl md:text-3xl font-serif font-light uppercase tracking-wide">
                    {t("auth.loginTitle")}
                  </h1>
                  <p className="text-xs text-neutral-500">
                    {nextPath.startsWith("/admin")
                      ? t("auth.loginAdminHint")
                      : t("auth.loginSubtitle")}
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                    {t("label.email")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors dark:bg-neutral-950 dark:border-neutral-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                    {t("label.password")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors dark:bg-neutral-950 dark:border-neutral-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded-xs"
                    />
                    {t("auth.remember")}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-neutral-500 underline hover:text-black"
                  >
                    {t("auth.forgot")}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] hover:text-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {loading ? t("auth.loggingIn") : t("auth.loginTitle")}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-[11px] text-neutral-400 text-center pt-2">
                  {t("auth.demoAdmin")}
                </p>

                <div className="pt-4 text-center border-t border-neutral-100 text-xs text-neutral-600">
                  <span>{t("auth.noAccount")} </span>
                  <Link
                    href="/register"
                    className="text-black font-semibold underline hover:text-[#C5A880] transition-colors"
                  >
                    {t("btn.register")}
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function LoginFallback() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center text-xs uppercase tracking-widest text-neutral-400">
      {t("common.loading")}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
