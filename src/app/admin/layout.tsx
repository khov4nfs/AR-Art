import React from "react";
import AdminLayoutWrapper from "@/components/admin/AdminLayoutWrapper";

export const metadata = {
  title: "EVERIE Administration Portal | Quản Trị Hệ Thống",
  description: "Trang quản trị nội dung Headless CMS & E-commerce EVERIE",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutWrapper>{children}</AdminLayoutWrapper>;
}
