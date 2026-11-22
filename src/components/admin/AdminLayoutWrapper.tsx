"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/common/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Menu,
  X,
  ExternalLink,
  LayoutDashboard,
  Palette,
  Package,
  ShoppingCart,
  Users,
  Image as ImageIcon,
  Settings,
  FileText,
  Flower2,
  ScanLine,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";

function isAdminRole(role?: string) {
  return role === "SUPER_ADMIN" || role === "CONTENT_EDITOR";
}

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, ready } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem("hanoia_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const authChecked = ready;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const adminUser =
    isAuthenticated && user && isAdminRole(user.role)
      ? {
        id: user.id,
        fullName: user.name,
        email: user.email,
        role: user.role as "SUPER_ADMIN" | "CONTENT_EDITOR",
        tier: user.tier,
        avatar: user.avatar,
      }
      : null;

  useEffect(() => {
    try {
      localStorage.removeItem("hanoia_admin_user");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!authChecked || !ready) return;
    if (!adminUser) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
    }
  }, [authChecked, ready, adminUser, router, pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("hanoia_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    void logout().then(() => router.push("/login"));
  };

  const isSuperAdmin = adminUser?.role === "SUPER_ADMIN";
  const navItems = [
    {
      title: t("admin.nav.dashboard"),
      href: "/admin",
      icon: LayoutDashboard,
      badge: "Live",
    },
    {
      title: t("admin.nav.customize"),
      href: "/admin/customize",
      icon: Palette,
    },
    {
      title: t("admin.nav.products"),
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "AR / Digital Atelier",
      href: "/admin/ar",
      icon: ScanLine,
    },
    ...(isSuperAdmin
      ? [
          {
            title: t("admin.nav.orders"),
            href: "/admin/orders",
            icon: ShoppingCart,
          },
          {
            title: t("admin.nav.bespoke"),
            href: "/admin/bespoke",
            icon: Flower2,
          },
          {
            title: t("admin.nav.users"),
            href: "/admin/users",
            icon: Users,
          },
        ]
      : []),
    {
      title: t("admin.nav.media"),
      href: "/admin/media",
      icon: ImageIcon,
    },
    {
      title: t("admin.nav.pages"),
      href: "/admin/pages",
      icon: FileText,
    },
    ...(isSuperAdmin
      ? [
          {
            title: t("admin.nav.settings"),
            href: "/admin/settings",
            icon: Settings,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const currentNav = navItems.find((item) => isActive(item.href)) || {
    title: t("admin.nav.dashboard"),
  };

  if (!authChecked || !adminUser) {
    return (
      <div className="min-h-screen bg-[#0C0C0E] text-stone-300 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-mono">
            {!authChecked ? t("admin.checking") : t("admin.redirectLogin")}
          </p>
        </div>
      </div>
    );
  }

  const sidebarWidthClass = isCollapsed ? "lg:w-20" : "lg:w-64";
  const mainOffsetClass = isCollapsed ? "lg:ml-20" : "lg:ml-64";

  return (
    <div className="admin-shell min-h-screen bg-[#0C0C0E] text-stone-200 flex flex-col lg:flex-row">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-xs transition-opacity"
        />
      )}

      {/* =====================================================================
          SIDEBAR (FULL / COLLAPSED DESKTOP + SLIDEOUT MOBILE)
         ===================================================================== */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111113] border-r border-stone-800/80 flex flex-col select-none transition-all duration-300 ease-in-out ${sidebarWidthClass} ${mobileMenuOpen
          ? "translate-x-0 w-64"
          : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 px-4 flex items-center justify-between border-b border-stone-800/60 ${isCollapsed ? "lg:justify-center lg:px-2" : "px-6"
            }`}
        >
          {isCollapsed ? (
            <div className="hidden lg:flex items-center justify-center">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A880] to-[#8C6D46] flex items-center justify-center font-serif text-black font-bold text-sm shadow">
                E
              </span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif tracking-[0.25em] text-lg text-white font-bold">
                  EVERIE
                </span>

              </div>
              <p className="text-[10px] text-stone-500 font-mono tracking-wider">
                ADMINISTRATION PORTAL
              </p>
            </div>
          )}

          {/* Close for mobile drawer */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
              {t("admin.nav.content")}
            </div>
          )}

          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                title={isCollapsed ? item.title : undefined}
                className={`flex items-center rounded-xl text-xs font-medium transition-all group ${isCollapsed
                  ? "justify-center p-3"
                  : "justify-between px-3.5 py-2.5"
                  } ${active
                    ? "bg-[#C5A880] text-black font-semibold shadow-md shadow-[#C5A880]/15"
                    : "text-stone-400 hover:text-white hover:bg-stone-800/60"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${active
                      ? "text-black"

                      : "text-stone-400"
                      }`}
                  />
                  {!isCollapsed && (

                    <span className="truncate">{item.title}</span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${active
                      ? "bg-black/20 text-black"
                      : "bg-stone-800 text-[#C5A880] border border-[#C5A880]/20"
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {!isCollapsed && (
            <>
              <div className="pt-6 px-3 pb-2 text-[10px] font-semibold tracking-wider text-stone-500 uppercase">
                {t("admin.nav.storefront")}
              </div>
              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-stone-800/60 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-[#C5A880]" />
                  <span>{t("admin.nav.viewStore")}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-600 group-hover:text-stone-400" />
              </Link>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          className={`p-3 border-t border-stone-800/70 bg-[#0E0E10] ${isCollapsed ? "flex justify-center" : ""}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C5A880] to-[#8C6D46] flex items-center justify-center text-black font-bold text-xs shrink-0 shadow">
              {adminUser.fullName
                ? adminUser.fullName.charAt(0).toUpperCase()
                : "A"}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-white truncate">
                    {adminUser.fullName}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                </div>
                <p className="text-[10px] text-stone-500 truncate">
                  {adminUser.email}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN CONTENT AREA WITH PERSISTENT TOP HEADER
         ===================================================================== */}
      <main
        className={`flex-1 min-h-screen flex flex-col min-w-0 bg-[#0C0C0E] transition-all duration-300 ease-in-out ${mainOffsetClass}`}
      >
        {/* TOP ADMIN HEADER BAR (STICKY, ALL VIEWPORTS) */}
        <header className="sticky top-0 z-30 h-16 bg-[#111113]/90 backdrop-blur-md border-b border-stone-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 select-none">
          {/* Left: Sidebar Toggle & Breadcrumbs */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Desktop Toggle: Collapse / Expand Sidebar */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-2 rounded-lg bg-stone-800/70 hover:bg-stone-700/80 text-stone-300 hover:text-white transition-colors cursor-pointer"
              title={
                isCollapsed
                  ? "Mở rộng thanh điều hướng"
                  : "Thu gọn thanh điều hướng"
              }
            >
              {isCollapsed ? (
                <PanelLeft className="w-4 h-4 text-[#C5A880]" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Toggle: Open Off-Canvas Drawer */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-stone-500 hidden sm:inline">
                CMS
              </span>
              <span className="text-xs text-stone-600 hidden sm:inline">/</span>
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate">
                {currentNav.title}
              </h2>
            </div>

            {/* Storefront Link Badge */}
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-stone-400 hover:text-[#C5A880] hover:bg-stone-800/50 transition-colors border border-stone-800/80"
              title={t("admin.nav.viewStore")}
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t("admin.nav.viewStore")}</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle variant="dropdown" />

            {/* Language Toggle */}
            <div
              className="flex items-center text-[11px] font-medium tracking-wide"
              title={t("admin.lang")}
            >
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`transition-colors cursor-pointer ${language === "vi"
                  ? "text-white font-semibold"
                  : "text-stone-500 hover:text-stone-200"
                  }`}
              >
                VI
              </button>
              <span className="text-stone-600 mx-1">|</span>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`transition-colors cursor-pointer ${language === "en"
                  ? "text-white font-semibold"
                  : "text-stone-500 hover:text-stone-200"
                  }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Right: User Profile with Interactive Dropdown (No Online badge, Full Name, Dropdown with Logout) */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1 sm:py-1.5 sm:px-3 bg-[#1A1A1D] hover:bg-stone-800 border border-stone-800 hover:border-stone-700 rounded-full transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C5A880]/50"
              aria-expanded={userDropdownOpen}
              title="Tài khoản quản trị viên"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C5A880] to-[#8C6D46] flex items-center justify-center text-black font-bold text-xs shrink-0 shadow">
                {adminUser.fullName
                  ? adminUser.fullName.charAt(0).toUpperCase()
                  : "A"}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-medium text-white whitespace-nowrap">
                  {adminUser.fullName}
                </div>
                <div className="text-[9px] text-[#C5A880] font-mono leading-none">
                  {adminUser.role === "SUPER_ADMIN"
                    ? t("admin.role.super")
                    : t("admin.role.editor")}
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 ${userDropdownOpen ? "rotate-180 text-[#C5A880]" : ""
                  }`}
              />
            </button>

            {/* Dropdown Popover */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#161619] border border-stone-800 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1">
                {/* User Info Header */}
                <div className="p-3 bg-[#1D1D22] rounded-xl border border-stone-800/80 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A880] to-[#8C6D46] flex items-center justify-center text-black font-bold text-sm shadow">
                      {adminUser.fullName
                        ? adminUser.fullName.charAt(0).toUpperCase()
                        : "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white break-words">
                        {adminUser.fullName}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate font-mono">
                        {adminUser.email}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>
                          {adminUser.role === "SUPER_ADMIN"
                            ? t("admin.role.super")
                            : t("admin.role.editor")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Items */}
                <Link
                  href="/admin/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-stone-300 hover:text-white hover:bg-stone-800/60 transition-colors"
                >
                  <Settings className="w-4 h-4 text-stone-400" />
                  <span>Cài đặt hệ thống & SEO</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-stone-300 hover:text-[#C5A880] hover:bg-stone-800/60 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-stone-400" />
                  <span>Xem cửa hàng trực tiếp</span>
                </Link>

                <div className="h-px bg-stone-800/80 my-1" />

                {/* Logout Action */}
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/50 transition-colors cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>{t("admin.logout")}</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <div className="flex-1 w-full min-w-0">{children}</div>
      </main>
    </div>
  );
}
