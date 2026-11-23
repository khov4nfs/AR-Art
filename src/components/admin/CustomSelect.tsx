"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ChevronDown, Search, Check, X, Loader2 } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md";
  pageSize?: number;
  onLoadMore?: () => Promise<void> | void;
  hasMore?: boolean;
  loading?: boolean;
  allowClear?: boolean;
  width?: string;
}

// Helper: Normalize Vietnamese string for intelligent accent-free search
function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d");
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Chọn một mục...",
  searchPlaceholder = "Tìm kiếm nhanh...",
  searchable = true,
  disabled = false,
  className = "",
  size = "md",
  pageSize = 25,
  onLoadMore,
  hasMore = false,
  loading = false,
  allowClear = false,
  width,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected Option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filtered Options (Instant Vietnamese-aware search)
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const normQ = normalizeStr(searchQuery);
    return options.filter(
      (opt) =>
        normalizeStr(opt.label).includes(normQ) ||
        normalizeStr(opt.value).includes(normQ) ||
        (opt.description && normalizeStr(opt.description).includes(normQ)) ||
        (opt.badge && normalizeStr(opt.badge).includes(normQ))
    );
  }, [options, searchQuery]);

  // Visible sliced options for Lazy Loading
  const visibleOptions = useMemo(() => {
    return filteredOptions.slice(0, visibleCount);
  }, [filteredOptions, visibleCount]);

  // Auto detect if dropdown should open upward or downward
  const checkPosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownHeight = 280; // approximate max dropdown height
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, []);

  // Handle open / toggle
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      checkPosition();
      setVisibleCount(pageSize);
      setIsOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Lazy loading scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 40;

    if (isNearBottom) {
      if (visibleCount < filteredOptions.length) {
        // Load next chunk internally
        setVisibleCount((prev) => Math.min(prev + pageSize, filteredOptions.length));
      } else if (hasMore && onLoadMore && !loading) {
        // Trigger external async fetch
        onLoadMore();
      }
    }
  };

  // Select Item
  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery("");
  };

  // Clear Selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${width || "w-full"} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full flex items-center justify-between gap-2 bg-[#1A1A1D] border rounded-lg transition-all text-left ${
          isOpen
            ? "border-[#C5A880] ring-1 ring-[#C5A880]/30 shadow-lg shadow-[#C5A880]/10"
            : "border-stone-800 hover:border-stone-700"
        } ${
          isSmall
            ? "px-2.5 py-1.5 text-[11px] leading-tight"
            : "px-3 py-2 text-xs leading-normal"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (() => {
            const Icon = selectedOption.icon;
            return <Icon className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />;
          })()}
          <span
            className={`truncate font-medium ${
              selectedOption ? "text-stone-200" : "text-stone-500"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/30">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-stone-400">
          {allowClear && value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 rounded hover:text-white hover:bg-stone-800 transition-colors"
              title="Xóa lựa chọn"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#C5A880]" : "text-stone-500"
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={`absolute left-0 z-50 min-w-full sm:min-w-[240px] max-w-[420px] bg-[#161619] border border-stone-700/80 rounded-xl shadow-2xl overflow-hidden animate-fadeIn backdrop-blur-md ${
            openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
          }`}
          style={{ width: "max-content", minWidth: "100%" }}
        >
          {/* Search Box */}
          {searchable && (
            <div className="p-2 border-b border-stone-800/80 bg-[#121214]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(pageSize);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-[#1A1A1D] border border-stone-800 rounded-md pl-8 pr-7 py-1.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:border-[#C5A880]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setVisibleCount(pageSize);
                    }}
                    className="absolute right-2 text-stone-400 hover:text-white p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Items List with Lazy Loading / Infinite Scroll */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-0.5"
          >
            {visibleOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-stone-500">
                {searchQuery ? "Không tìm thấy kết quả phù hợp" : "Không có lựa chọn nào"}
              </div>
            ) : (
              visibleOptions.map((opt) => {
                const isSelected = opt.value === value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors text-left group ${
                      isSelected
                        ? "bg-[#C5A880]/15 text-[#C5A880] font-semibold"
                        : "text-stone-300 hover:bg-stone-800/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {Icon && (
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isSelected ? "text-[#C5A880]" : "text-stone-500"
                          }`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate">{opt.label}</div>
                        {opt.description && (
                          <div className="text-[10px] text-stone-500 truncate mt-0.5">
                            {opt.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-medium ${
                            isSelected
                              ? "bg-[#C5A880]/20 text-[#C5A880]"
                              : "bg-stone-800 text-stone-400 group-hover:text-stone-300"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A880]" />}
                    </div>
                  </button>
                );
              })
            )}

            {/* Lazy Loading Status Indicator */}
            {(visibleCount < filteredOptions.length || loading) && (
              <div className="py-2 px-3 text-center text-[10px] text-stone-500 flex items-center justify-center gap-1.5 border-t border-stone-800/60 mt-1">
                {loading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-[#C5A880]" />
                    <span>Đang nạp thêm dữ liệu...</span>
                  </>
                ) : (
                  <span>
                    Hiển thị {visibleCount}/{filteredOptions.length} mục (Cuộn xuống để tải thêm...)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
