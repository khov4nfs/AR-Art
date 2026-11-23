"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SiteSettings } from "@/lib/store";

interface SettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => void;
  refreshSettings: () => Promise<void>;
}

const defaultSettingsFallback: SiteSettings = {
  siteName: "EVERIE",
  siteTagline: "Vẻ đẹp ở lại cùng thời gian",
  logoHeader: "/images/hanoia/logo-lettering.png",
  logoFooter: "/images/hanoia/logo-lettering.png",
  favicon: "/favicon.ico",
  hotline: "0908 188 188",
  workingHours: "9:00 - 18:00",
  email: "hello@everievn.com",
  copyrightVi: "© 2026 EVERIE. Hoa gốm thủ công — làng gốm Thanh Hà.",
  copyrightEn: "© 2026 EVERIE. Handmade ceramic flowers from Thanh Ha.",
  bctCertificateUrl: "http://online.gov.vn",
  bctBadgeImage: "/images/hanoia/logo-bct.webp",
  announcements: [
    { id: "1", text: "Vẻ đẹp ở lại cùng thời gian — hoa gốm Classic, Themed, Bespoke", link: "/", active: true },
    { id: "2", text: "Classic Flowers: chọn màu men, khắc chữ, 14–21 ngày", link: "/classic", active: true },
    { id: "3", text: "Themed Collection PHẤP · DỆT · VANG", link: "/themed", active: true },
    { id: "4", text: "Bespoke: gửi yêu cầu, sửa tối đa 3 lần", link: "/bespoke", active: true },
    { id: "5", text: "Tra cứu đơn bằng mã + email hoặc số điện thoại", link: "/lookup", active: true },
  ],
  showScrollToTop: true,
  showSocialSupport: true,
  messengerUrl: "https://m.me/everie.vn",
  zaloNumber: "0908 188 188",
  supportPhone: "0908 188 188",
  seoTitle: "EVERIE | Hoa gốm thủ công — Vẻ đẹp ở lại cùng thời gian",
  seoDescription: "Hoa gốm Classic, Themed và Bespoke. Làm theo đơn, khắc chữ, giao theo khoảng ngày chế tác.",
  seoKeywords: "everie, hoa gốm, gốm thủ công, classic flowers, themed, bespoke",
  seoOgImage: "/images/hanoia/hero-banner-3.webp",
  seoCanonical: "https://everievn.com",
  facebookUrl: "https://facebook.com/everie.vn",
  instagramUrl: "https://instagram.com/everie.vn",
  tiktokUrl: "https://tiktok.com/@everie.vn",
  craftClassicMin: 14,
  craftClassicMax: 21,
  craftThemedMin: 21,
  craftThemedMax: 28,
  craftBespokeMin: 30,
  craftBespokeMax: 45,
  shippingDaysMin: 2,
  shippingDaysMax: 5,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettingsFallback,
  updateSettings: () => {},
  refreshSettings: async () => {},
});

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: Partial<SiteSettings>;
}) {
  const [settings, setSettings] = useState<SiteSettings>({
    ...defaultSettingsFallback,
    ...initialSettings,
  });

  const refreshSettings = React.useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings((prev) => ({ ...prev, ...data.data }));
      }
    } catch {
      // Fail silently and keep existing settings
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!ignore && data.success && data.data) {
          setSettings((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const updateSettings = (newSettings: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
