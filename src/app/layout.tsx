import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { AppMotion } from "@/components/organisms/app-motion";
import { AuthCallbackForwarder } from "@/features/auth/presentation/components/auth-callback-forwarder";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "AR Art — WebAR image tracking",
  description: "An open-source browser AR experience for image-tracked artwork.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} font-sans antialiased`}>
        <AuthCallbackForwarder />
        <AppMotion />
        {children}
      </body>
    </html>
  );
}
