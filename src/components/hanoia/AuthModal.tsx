"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen, authModalTab, setAuthModalTab, login, register, lastError } = useAuth();
  const { showToast } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Vui lòng nhập đầy đủ thông tin đăng nhập");
      return;
    }
    setLoading(true);
    const loggedIn = await login(email, password);
    setLoading(false);
    if (loggedIn) {
      showToast(`Chào mừng quý khách trở lại với EVERIE!`);
    } else {
      showToast("Email hoặc mật khẩu không đúng");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }
    setLoading(true);
    const ok = await register(name, email, phone, password);
    setLoading(false);
    if (ok) {
      showToast("Chúc mừng quý khách đã trở thành hội viên EVERIE!");
    } else {
      showToast(lastError() || "Đăng ký thất bại");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => setAuthModalOpen(false)}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-950 rounded-xs shadow-2xl overflow-hidden z-10 animate-fade-in border border-neutral-200">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 text-neutral-400 hover:text-black focus:outline-hidden p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Headers */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-[2px] font-semibold">
          <button
            onClick={() => setAuthModalTab("login")}
            className={`flex-1 py-4 text-center transition-colors ${
              authModalTab === "login"
                ? "bg-white text-black border-t-2 border-black font-bold"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => setAuthModalTab("register")}
            className={`flex-1 py-4 text-center transition-colors ${
              authModalTab === "register"
                ? "bg-white text-black border-t-2 border-black font-bold"
                : "text-neutral-500 hover:text-black"
            }`}
          >
            Đăng ký thành viên
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 md:p-8">
          {authModalTab === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-xl font-serif font-light uppercase tracking-wide text-black">
                  Tài khoản Hanoia
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Đăng nhập để nhận các đặc quyền hội viên & tích lũy điểm thưởng
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700">
                    Mật khẩu
                  </label>
                  <Link
                    href="/forgot-password"
                    onClick={() => setAuthModalOpen(false)}
                    className="text-[11px] text-neutral-500 hover:text-black underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white text-xs uppercase tracking-[2px] font-semibold hover:bg-[#C5A880] transition-colors rounded-xs shadow-md mt-2"
              >
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  onClick={() => setAuthModalOpen(false)}
                  className="text-xs text-neutral-500 hover:text-black underline"
                >
                  Mở trang đăng nhập chi tiết
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="text-center space-y-1 mb-3">
                <h3 className="text-xl font-serif font-light uppercase tracking-wide text-black">
                  Gia nhập Hanoia VIP Club
                </h3>
                <p className="text-xs text-neutral-500 font-light">
                  Đặc quyền quà tặng sinh nhật & dịch vụ bảo dưỡng sơn mài miễn phí
                </p>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1">
                  Họ và tên
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-hidden focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-1 text-[11px] text-neutral-500">
                <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0 mt-0.5" />
                <span>Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Hanoia</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#C5A880] text-black text-xs uppercase tracking-[2px] font-bold hover:bg-black hover:text-white transition-colors rounded-xs shadow-md mt-2"
              >
                {loading ? "Đang tạo tài khoản..." : "Đăng ký thành viên"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
