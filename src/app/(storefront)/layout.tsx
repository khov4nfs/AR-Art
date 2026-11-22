import { cookies } from "next/headers";
import { getDatabase } from "@/lib/store";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import ScrollToTopAndSupport from "@/components/hanoia/ScrollToTopAndSupport";
import CartDrawer from "@/components/hanoia/CartDrawer";
import QuickViewModal from "@/components/hanoia/QuickViewModal";
import SearchModal from "@/components/hanoia/SearchModal";
import MobileMenu from "@/components/hanoia/MobileMenu";
import AuthModal from "@/components/hanoia/AuthModal";
import Toast from "@/components/hanoia/Toast";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const savedCurr = cookieStore.get("hanoia_currency")?.value as
    | "VND"
    | "USD"
    | undefined;
  const initialCurrency: "VND" | "USD" =
    savedCurr === "VND" || savedCurr === "USD" ? savedCurr : "VND";

  const db = await getDatabase();
  const settings = db.settings;

  return (
    <SettingsProvider initialSettings={settings}>
      <CartProvider initialCurrency={initialCurrency}>
        <div className="storefront-shell min-h-screen bg-background text-foreground">
          {children}
        </div>
        <CartDrawer />
        <QuickViewModal />
        <SearchModal />
        <MobileMenu />
        <AuthModal />
        <Toast />
        <ScrollToTopAndSupport />
      </CartProvider>
    </SettingsProvider>
  );
}
