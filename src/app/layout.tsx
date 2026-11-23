import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider, Language } from "@/context/LanguageContext";
import { getDatabase } from "@/lib/store";

export async function generateMetadata(): Promise<Metadata> {
  const db = await getDatabase();
  const s = db.settings;
  const title = s.seoTitle || `${s.siteName} | ${s.siteTagline}`;
  const description =
    s.seoDescription ||
    `${s.siteName} — ${s.siteTagline}. Hoa gốm thủ công Classic, Themed và Bespoke từ làng gốm Thanh Hà.`;
  const ogImage = s.seoOgImage || s.logoHeader || "/images/hanoia/hero-banner-3.webp";
  const canonical = s.seoCanonical || "https://everievn.com";

  return {
    metadataBase: new URL(canonical),
    title: {
      default: title,
      template: `%s | ${s.siteName || "EVERIE"}`,
    },
    description,
    keywords: s.seoKeywords ? s.seoKeywords.split(",").map((k) => k.trim()) : undefined,
    alternates: {
      canonical,
    },
    icons: {
      icon: s.favicon || "/favicon.ico",
      shortcut: s.favicon || "/favicon.ico",
      apple: s.favicon || "/favicon.ico",
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: s.siteName,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// Inline script to prevent FOUC (flash of unstyled content) on dark mode
const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('hanoia_theme');
    var d = (!t || t === 'system')
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    if (d === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const db = await getDatabase();
  const s = db.settings;
  const title = s.seoTitle || `${s.siteName} | ${s.siteTagline}`;
  const description =
    s.seoDescription ||
    `${s.siteName} — ${s.siteTagline}. Hoa gốm thủ công Classic, Themed và Bespoke từ làng gốm Thanh Hà.`;
  const ogImage = s.seoOgImage || s.logoHeader || "/images/hanoia/hero-banner-3.webp";
  const canonical = s.seoCanonical || "https://everievn.com";

  const cookieStore = await cookies();
  const savedLang = cookieStore.get("hanoia_language")?.value as
    | Language
    | undefined;
  const initialLanguage: Language =
    savedLang === "vi" || savedLang === "en" ? savedLang : "vi";

  return (
    <html
      lang={initialLanguage}
      className="h-full"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <title>{title}</title>
        <meta name="description" content={description} />
        {s.seoKeywords && <meta name="keywords" content={s.seoKeywords} />}
        <link rel="canonical" href={canonical} />
        <link rel="icon" href={s.favicon || "/favicon.ico"} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:site_name" content={s.siteName} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={ogImage} />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased bg-background text-foreground transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <AuthProvider>
              {children}
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
