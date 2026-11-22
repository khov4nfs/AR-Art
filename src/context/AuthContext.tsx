"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Client auth state. The source of truth is the signed httpOnly session cookie
 * on the server; this context only mirrors /api/auth/me. Nothing secret is
 * kept in localStorage.
 */

export interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  city: string;
  isDefault?: boolean;
}

export type OrderStatus =
  | "Chờ xác nhận"
  | "Đang chế tác"
  | "Đang xử lý"
  | "Đang vận chuyển"
  | "Đã giao hàng"
  | "Hư hỏng khi vận chuyển"
  | "Đã hủy";

export interface AccountOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  shippingFee?: number;
  discountAmount?: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus?: "Chưa thanh toán" | "Đã thanh toán" | "Đã hoàn tiền";
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  trackingCode?: string;
  timeline?: { time: string; title: string; note: string }[];
  items: {
    productId?: string;
    sku?: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    color?: string;
    engravingText?: string;
    giftMessage?: string;
    previewImage?: string;
  }[];
  expectedMinDays?: number;
  expectedMaxDays?: number;
  hasEngraving?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: "Nam" | "Nữ" | "Khác";
  birthday?: string;
  tier: "Silver" | "Gold" | "Platinum";
  points?: number;
  avatar?: string;
  role?: "SUPER_ADMIN" | "CONTENT_EDITOR" | "CUSTOMER";
  addresses: Address[];
  emailVerified?: boolean;
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  /** False until the first /api/auth/me answer. */
  ready: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  updateProfile: (data: Partial<Pick<User, "name" | "phone" | "gender" | "birthday">> & { addresses?: Address[] }) => Promise<Result>;
  addresses: Address[];
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: "login" | "register";
  setAuthModalTab: (tab: "login" | "register") => void;
  /** Last error message from login/register (server text, already localized when possible). */
  authError: string | null;
  /** Synchronous read of the last error (state may not have re-rendered yet). */
  lastError: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  tier?: User["tier"];
  points?: number;
  avatar?: string;
  role?: User["role"];
  gender?: User["gender"];
  birthday?: string;
  addresses?: Address[];
  emailVerified?: boolean;
};

function mapApiUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.fullName,
    email: u.email,
    phone: u.phone,
    gender: u.gender,
    birthday: u.birthday,
    tier: u.tier || "Silver",
    points: u.points || 0,
    avatar: u.avatar,
    role: u.role || "CUSTOMER",
    addresses: u.addresses || [],
    emailVerified: u.emailVerified,
  };
}

export const AUTH_EVENT = "everie:auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [authError, setAuthErrorState] = useState<string | null>(null);
  const errRef = useRef<string | null>(null);
  const setAuthError = (e: string | null) => {
    errRef.current = e;
    setAuthErrorState(e);
  };

  const applyUser = useCallback((u: User | null) => {
    setUser(u);
    // Lets CartContext merge/sync the wishlist without a circular import.
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: u ? { id: u.id } : null }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = res.ok ? await res.json() : null;
      const u = data?.success ? mapApiUser(data.data) : null;
      applyUser(u);
      return u;
    } catch {
      return null;
    } finally {
      setReady(true);
    }
  }, [applyUser]);

  useEffect(() => {
    // Old builds cached the user in localStorage; the cookie is the truth now.
    try {
      localStorage.removeItem("hanoia_user");
      localStorage.removeItem("hanoia_addresses");
    } catch {
      // ignore
    }
    void refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        // 401 → generic "wrong email/password" (translated by the caller).
        setAuthError(res.status === 401 ? null : data.error || null);
        return null;
      }
      const mapped = mapApiUser(data.data);
      applyUser(mapped);
      setAuthModalOpen(false);
      return mapped;
    } catch {
      setAuthError("Không kết nối được máy chủ");
      return null;
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    setAuthError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, phone, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setAuthError(data.error || "Đăng ký thất bại");
        return false;
      }
      // The server already set the session cookie (auto sign-in).
      applyUser(mapApiUser(data.data));
      setAuthModalOpen(false);
      return true;
    } catch {
      setAuthError("Không kết nối được máy chủ");
      return false;
    }
  };

  const logout = async () => {
    applyUser(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  const updateProfile: AuthContextType["updateProfile"] = async (d) => {
    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(d.name !== undefined ? { fullName: d.name } : {}),
        ...(d.phone !== undefined ? { phone: d.phone } : {}),
        ...(d.gender !== undefined ? { gender: d.gender } : {}),
        ...(d.birthday !== undefined ? { birthday: d.birthday } : {}),
        ...(d.addresses !== undefined ? { addresses: d.addresses } : {}),
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    if (!data?.success) return { ok: false, error: data?.error || "Lỗi kết nối" };
    setUser(mapApiUser(data.data));
    return { ok: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<Result> => {
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => null) : null;
    return data?.success ? { ok: true } : { ok: false, error: data?.error || "Lỗi kết nối" };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refresh,
        updateProfile,
        addresses: user?.addresses || [],
        changePassword,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        authError,
        lastError: () => errRef.current,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
