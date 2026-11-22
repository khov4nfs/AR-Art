"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useMounted } from "@/hooks/useMounted";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown" | "pill";
  className?: string;
}

export default function ThemeToggle({
  variant = "icon",
  className = "",
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const mounted = useMounted();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!mounted) {
    // Avoid hydration mismatch by rendering a placeholder
    return (
      <div
        className={`w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 opacity-60 ${className}`}
        aria-hidden="true"
      />
    );
  }

  // 1. PILL SWITCH (Ideal for Mobile Drawer or Settings)
  if (variant === "pill") {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
            resolvedTheme === "light"
              ? "bg-white text-black shadow-xs font-semibold"
              : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          }`}
          aria-label="Chế độ Sáng"
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Sáng</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
            resolvedTheme === "dark"
              ? "bg-[#C5A880] text-black shadow-xs font-semibold"
              : "text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white"
          }`}
          aria-label="Chế độ Tối"
        >
          <Moon className="w-3.5 h-3.5 text-indigo-900 dark:text-black" />
          <span>Tối</span>
        </button>
      </div>
    );
  }

  // 2. DROPDOWN SELECTOR (Light / Dark / System)
  if (variant === "dropdown") {
    return (
      <div
        className={`relative inline-block text-left ${className}`}
        ref={menuRef}
      >
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 text-xs font-medium hover:border-[#C5A880] dark:hover:border-[#C5A880] transition-colors cursor-pointer"
          aria-expanded={menuOpen}
          aria-label="Lựa chọn giao diện hiển thị"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className="capitalize text-[11px]">
            {theme === "system"
              ? "Hệ thống"
              : theme === "dark"
                ? "Giao diện Tối"
                : "Giao diện Sáng"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-36 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl p-1 z-50 animate-fadeIn text-xs space-y-0.5">
            <button
              onClick={() => {
                setTheme("light");
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === "light"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Giao diện Sáng</span>
            </button>
            <button
              onClick={() => {
                setTheme("dark");
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === "dark"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Giao diện Tối</span>
            </button>
            <button
              onClick={() => {
                setTheme("system");
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === "system"
                  ? "bg-neutral-100 dark:bg-neutral-800 text-black dark:text-white font-semibold"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-neutral-500" />
              <span>Theo hệ điều hành</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. ICON BUTTON (Default: Compact toggle button for headers)
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white/80 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-[#C5A880] dark:hover:border-[#C5A880] hover:text-[#C5A880] cursor-pointer focus:outline-hidden ${className}`}
      aria-label={
        resolvedTheme === "dark"
          ? "Chuyển sang chế độ Sáng"
          : "Chuyển sang chế độ Tối"
      }
      title={
        resolvedTheme === "dark"
          ? "Chuyển sang chế độ Sáng (Light Mode)"
          : "Chuyển sang chế độ Tối (Dark Mode)"
      }
    >
      <Sun
        className={`w-4 h-4 text-amber-500 transition-all duration-300 absolute ${
          resolvedTheme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
        }`}
      />
      <Moon
        className={`w-4 h-4 text-[#C5A880] transition-all duration-300 absolute ${
          resolvedTheme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
