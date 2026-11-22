"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User as UserIcon, Package, Sparkles, MapPin, Lock, Heart, LogOut } from "lucide-react";
import Header from "@/components/hanoia/Header";
import Footer from "@/components/hanoia/Footer";
import { useAuth, type Address, type User } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { statusText } from "@/lib/statusText";

type Tab = "profile" | "orders" | "bespoke" | "addresses" | "password";
const TABS: Tab[] = ["profile", "orders", "bespoke", "addresses", "password"];

type OrderRow = { id: string; orderNumber: string; date: string; total: number; status: string; items: { name: string }[] };
type BespokeRow = { id: string; code: string; createdAt: string; status: string; occasion?: string; revisionCount?: number; maxRevisions?: number; quoteAmount?: number };

const COPY = {
  vi: {
    title: "Tài khoản của tôi", hello: "Xin chào", logout: "Đăng xuất", wishlist: "Yêu thích",
    tabs: { profile: "Hồ sơ", orders: "Đơn hàng", bespoke: "Thiết kế riêng", addresses: "Địa chỉ", password: "Mật khẩu" },
    name: "Họ tên", phone: "Số điện thoại", email: "Email", gender: "Giới tính", birthday: "Ngày sinh",
    genders: { "": "—", Nam: "Nam", "Nữ": "Nữ", "Khác": "Khác" } as Record<string, string>,
    save: "Lưu thay đổi", saved: "Đã lưu.", verified: "Email đã xác minh", unverified: "Email chưa xác minh",
    verifiedOk: "Xác minh email thành công. Các đơn đặt bằng email này đã được gắn vào tài khoản.",
    verifiedFail: "Liên kết xác minh không hợp lệ hoặc đã hết hạn.",
    noOrders: "Bạn chưa có đơn hàng nào.", shop: "Mua sắm ngay", view: "Chi tiết",
    claimTitle: "Thêm đơn đã đặt khi chưa đăng nhập", claimHint: "Nhập mã đơn và số điện thoại đã dùng khi đặt.",
    orderNo: "Mã đơn (VD: EVR-...)", claim: "Thêm đơn", claimed: "Đã thêm đơn vào tài khoản.",
    noBespoke: "Chưa có yêu cầu thiết kế riêng.", newBespoke: "Gửi yêu cầu thiết kế", revisions: "Lượt sửa", quote: "Báo giá",
    noAddr: "Chưa có địa chỉ.", addAddr: "Thêm địa chỉ", street: "Số nhà, đường", ward: "Phường/Xã", district: "Quận/Huyện", city: "Tỉnh/Thành phố",
    default: "Mặc định", makeDefault: "Đặt mặc định", remove: "Xóa", add: "Thêm",
    curPw: "Mật khẩu hiện tại", newPw: "Mật khẩu mới", newPw2: "Nhập lại mật khẩu mới", changePw: "Đổi mật khẩu",
    pwChanged: "Đã đổi mật khẩu.", pwMismatch: "Mật khẩu xác nhận không khớp.", required: "Vui lòng nhập đủ thông tin.",
  },
  en: {
    title: "My account", hello: "Hello", logout: "Sign out", wishlist: "Wishlist",
    tabs: { profile: "Profile", orders: "Orders", bespoke: "Bespoke", addresses: "Addresses", password: "Password" },
    name: "Full name", phone: "Phone", email: "Email", gender: "Gender", birthday: "Birthday",
    genders: { "": "—", Nam: "Male", "Nữ": "Female", "Khác": "Other" } as Record<string, string>,
    save: "Save changes", saved: "Saved.", verified: "Email verified", unverified: "Email not verified",
    verifiedOk: "Email verified. Orders placed with this email are now in your account.",
    verifiedFail: "The verification link is invalid or has expired.",
    noOrders: "You have no orders yet.", shop: "Start shopping", view: "Details",
    claimTitle: "Add an order placed as a guest", claimHint: "Enter the order code and the phone number used at checkout.",
    orderNo: "Order code (e.g. EVR-...)", claim: "Add order", claimed: "Order added to your account.",
    noBespoke: "No bespoke requests yet.", newBespoke: "Request a design", revisions: "Revisions", quote: "Quote",
    noAddr: "No saved addresses.", addAddr: "Add address", street: "Street address", ward: "Ward", district: "District", city: "City/Province",
    default: "Default", makeDefault: "Make default", remove: "Remove", add: "Add",
    curPw: "Current password", newPw: "New password", newPw2: "Confirm new password", changePw: "Change password",
    pwChanged: "Password changed.", pwMismatch: "Passwords do not match.", required: "Please fill in all fields.",
  },
};
type Copy = (typeof COPY)["vi"];

const field = "w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-sm focus:outline-hidden focus:border-black";
const btn = "px-5 py-2.5 bg-black text-white text-[11px] uppercase tracking-[2px] font-semibold disabled:opacity-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  if (!text) return null;
  return (
    <p role={ok ? "status" : "alert"} className={`text-xs ${ok ? "text-green-700" : "text-red-600"}`}>
      {text}
    </p>
  );
}

function ProfileTab({ user, c }: { user: User; c: Copy }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [gender, setGender] = useState<string>(user.gender || "");
  const [birthday, setBirthday] = useState(user.birthday || "");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const [busy, setBusy] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await updateProfile({ name: name.trim(), phone: phone.trim(), gender: (gender || undefined) as User["gender"], birthday });
    setBusy(false);
    setMsg(r.ok ? { ok: true, text: c.saved } : { ok: false, text: r.error });
  };
  return (
    <form onSubmit={save} noValidate className="space-y-4 max-w-lg" data-testid="profile-form">
      <Field label={c.name}><input className={field} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label={c.email}>
        <input className={`${field} text-neutral-500`} value={user.email} disabled />
        <span className={`text-[11px] ${user.emailVerified ? "text-green-700" : "text-neutral-500"}`}>
          {user.emailVerified ? c.verified : c.unverified}
        </span>
      </Field>
      <Field label={c.phone}><input className={field} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={c.gender}>
          <select className={field} value={gender} onChange={(e) => setGender(e.target.value)}>
            {Object.entries(c.genders).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label={c.birthday}><input type="date" className={field} value={birthday} onChange={(e) => setBirthday(e.target.value)} /></Field>
      </div>
      <Msg {...msg} />
      <button className={btn} disabled={busy}>{c.save}</button>
    </form>
  );
}

function OrdersTab({ c, lang }: { c: Copy; lang: string }) {
  const { formatPrice } = useCart();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const load = useCallback(async () => {
    const r = await fetch("/api/account/orders").then((x) => x.json()).catch(() => null);
    setOrders(r?.success ? r.data : []);
  }, []);
  useEffect(() => {
    let alive = true;
    fetch("/api/account/orders")
      .then((x) => x.json())
      .then((r) => alive && setOrders(r?.success ? r.data : []))
      .catch(() => alive && setOrders([]));
    return () => {
      alive = false;
    };
  }, []);
  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) return setMsg({ ok: false, text: c.required });
    const res = await fetch("/api/account/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: orderNumber.trim(), phone: phone.trim() }),
    }).catch(() => null);
    const r = res ? await res.json().catch(() => null) : null;
    if (!r?.success) return setMsg({ ok: false, text: r?.error || "Error" });
    setMsg({ ok: true, text: c.claimed });
    setOrderNumber("");
    setPhone("");
    await load();
  };
  return (
    <div className="space-y-8">
      {orders === null ? (
        <p className="text-xs text-neutral-400">…</p>
      ) : orders.length === 0 ? (
        <div className="text-sm text-neutral-500 space-y-3">
          <p>{c.noOrders}</p>
          <Link href="/collections" className="underline text-black text-xs uppercase tracking-widest">{c.shop}</Link>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200" data-testid="order-list">
          {orders.map((o) => (
            <li key={o.id} className="p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-sm">{o.orderNumber}</p>
                <p className="text-xs text-neutral-500 truncate">
                  {o.date} · {o.items.map((i) => i.name).join(", ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-1 bg-neutral-100">{statusText(o.status, lang)}</span>
                <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                <Link href={`/account/orders/${o.id}`} className="text-xs underline uppercase tracking-wider">{c.view}</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={claim} noValidate className="border border-dashed border-neutral-300 p-4 space-y-3 max-w-lg" data-testid="claim-form">
        <p className="text-sm font-semibold">{c.claimTitle}</p>
        <p className="text-xs text-neutral-500">{c.claimHint}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={field} placeholder={c.orderNo} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          <input className={field} placeholder={c.phone} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <Msg {...msg} />
        <button className={btn}>{c.claim}</button>
      </form>
    </div>
  );
}

function BespokeTab({ c, lang }: { c: Copy; lang: string }) {
  const { formatPrice } = useCart();
  const [rows, setRows] = useState<BespokeRow[] | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/account/bespoke")
      .then((x) => x.json())
      .then((r) => alive && setRows(r?.success ? r.data : []))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);
  if (rows === null) return <p className="text-xs text-neutral-400">…</p>;
  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <p className="text-sm text-neutral-500">{c.noBespoke}</p>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200" data-testid="bespoke-list">
          {rows.map((b) => (
            <li key={b.id} className="p-4 flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold">{b.code}</p>
                <p className="text-xs text-neutral-500">{b.createdAt}{b.occasion ? ` · ${b.occasion}` : ""}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="px-2 py-1 bg-neutral-100">{statusText(b.status, lang)}</span>
                <span>{c.revisions}: {b.revisionCount ?? 0}/{b.maxRevisions ?? 3}</span>
                {b.quoteAmount ? <span>{c.quote}: {formatPrice(b.quoteAmount)}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Link href="/bespoke" className="inline-block text-xs underline uppercase tracking-widest">{c.newBespoke}</Link>
    </div>
  );
}

const emptyAddr = { name: "", phone: "", address: "", ward: "", district: "", city: "" };

function AddressesTab({ user, c }: { user: User; c: Copy }) {
  const { updateProfile } = useAuth();
  const [form, setForm] = useState(emptyAddr);
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const list = user.addresses;
  const save = async (next: Address[]) => {
    const r = await updateProfile({ addresses: next });
    setMsg(r.ok ? { ok: true, text: c.saved } : { ok: false, text: r.error });
    return r.ok;
  };
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim() || !form.city.trim()) {
      return setMsg({ ok: false, text: c.required });
    }
    const next: Address = { id: `addr-${Date.now()}`, ...form, isDefault: list.length === 0 };
    if (await save([...list, next])) setForm(emptyAddr);
  };
  return (
    <div className="space-y-6">
      {list.length === 0 ? (
        <p className="text-sm text-neutral-500">{c.noAddr}</p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-3" data-testid="address-list">
          {list.map((a) => (
            <li key={a.id} className={`border p-4 text-sm space-y-1 ${a.isDefault ? "border-black" : "border-neutral-200"}`}>
              <p className="font-semibold">
                {a.name} · {a.phone}
                {a.isDefault && <span className="ml-2 text-[10px] uppercase tracking-wider bg-black text-white px-1.5 py-0.5">{c.default}</span>}
              </p>
              <p className="text-neutral-600">{[a.address, a.ward, a.district, a.city].filter(Boolean).join(", ")}</p>
              <div className="flex gap-4 pt-2 text-xs underline">
                {!a.isDefault && (
                  <button type="button" onClick={() => save(list.map((x) => ({ ...x, isDefault: x.id === a.id })))}>{c.makeDefault}</button>
                )}
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() => {
                    const rest = list.filter((x) => x.id !== a.id);
                    if (a.isDefault && rest[0]) rest[0] = { ...rest[0], isDefault: true };
                    void save(rest);
                  }}
                >
                  {c.remove}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={add} noValidate className="border border-dashed border-neutral-300 p-4 space-y-3 max-w-lg" data-testid="address-form">
        <p className="text-sm font-semibold">{c.addAddr}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(["name", "phone", "address", "ward", "district", "city"] as const).map((k) => (
            <input
              key={k}
              name={k}
              className={`${field} ${k === "address" ? "sm:col-span-2" : ""}`}
              placeholder={k === "address" ? c.street : (c as Record<string, unknown>)[k] as string}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          ))}
        </div>
        <Msg {...msg} />
        <button className={btn}>{c.add}</button>
      </form>
    </div>
  );
}

function PasswordTab({ c }: { c: Copy }) {
  const { changePassword } = useAuth();
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState({ ok: true, text: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cur || !pw) return setMsg({ ok: false, text: c.required });
    if (pw !== pw2) return setMsg({ ok: false, text: c.pwMismatch });
    const r = await changePassword(cur, pw);
    if (!r.ok) return setMsg({ ok: false, text: r.error });
    setMsg({ ok: true, text: c.pwChanged });
    setCur("");
    setPw("");
    setPw2("");
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4 max-w-sm" data-testid="password-form">
      <Field label={c.curPw}><input type="password" autoComplete="current-password" className={field} value={cur} onChange={(e) => setCur(e.target.value)} /></Field>
      <Field label={c.newPw}><input type="password" autoComplete="new-password" className={field} value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field label={c.newPw2}><input type="password" autoComplete="new-password" className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
      <Msg {...msg} />
      <button className={btn}>{c.changePw}</button>
    </form>
  );
}

const ICONS = { profile: UserIcon, orders: Package, bespoke: Sparkles, addresses: MapPin, password: Lock };

function AccountInner() {
  const { user, ready, logout } = useAuth();
  const { language } = useLanguage();
  const c = language === "en" ? COPY.en : COPY.vi;
  const router = useRouter();
  const params = useSearchParams();
  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : "profile";
  const verified = params.get("verified");

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="flex-1 flex items-center justify-center text-xs uppercase tracking-widest text-neutral-400">…</div>;
  }

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-10 md:py-16" data-testid="account-page">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[3px] text-[#C5A880]">{c.title}</p>
          <h1 className="font-serif text-2xl md:text-3xl mt-1">{c.hello}, {user.name}</h1>
          <p className="text-xs text-neutral-500 mt-1">{user.email} · {user.tier}{user.points ? ` · ${user.points} pts` : ""}</p>
        </div>
        <div className="flex gap-4 text-xs uppercase tracking-widest">
          <Link href="/wishlist" className="flex items-center gap-1 underline"><Heart className="w-3.5 h-3.5" />{c.wishlist}</Link>
          <button
            type="button"
            data-testid="account-logout"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="flex items-center gap-1 underline"
          >
            <LogOut className="w-3.5 h-3.5" />{c.logout}
          </button>
        </div>
      </div>
      {verified && (
        <div className="mb-6"><Msg ok={verified === "1"} text={verified === "1" ? c.verifiedOk : c.verifiedFail} /></div>
      )}
      <div className="grid md:grid-cols-[200px_1fr] gap-8">
        <nav className="flex md:flex-col gap-1 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0" aria-label={c.title}>
          {TABS.map((k) => {
            const Icon = ICONS[k];
            return (
              <Link
                key={k}
                href={`/account?tab=${k}`}
                scroll={false}
                data-testid={`tab-${k}`}
                aria-current={tab === k ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-xs uppercase tracking-wider ${
                  tab === k ? "bg-black text-white" : "hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {c.tabs[k]}
              </Link>
            );
          })}
        </nav>
        <section>
          {tab === "profile" && <ProfileTab key={user.id} user={user} c={c} />}
          {tab === "orders" && <OrdersTab c={c} lang={language} />}
          {tab === "bespoke" && <BespokeTab c={c} lang={language} />}
          {tab === "addresses" && <AddressesTab user={user} c={c} />}
          {tab === "password" && <PasswordTab c={c} />}
        </section>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Header />
      <Suspense fallback={null}>
        <AccountInner />
      </Suspense>
      <Footer />
    </div>
  );
}
