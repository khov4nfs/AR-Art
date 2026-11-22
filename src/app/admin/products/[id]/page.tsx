"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle } from "lucide-react";
import { ProductItem } from "@/lib/store";
import ProductEditorForm from "@/components/admin/ProductEditorForm";

export default function AdminProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProduct(data.data);
        } else {
          setError("Không tìm thấy sản phẩm này");
        }
      } catch (err) {
        setError("Lỗi kết nối khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center text-stone-400">
        <Clock className="w-8 h-8 animate-spin mx-auto text-[#C5A880] mb-3" />
        Đang tải thông tin sản phẩm và cấu hình SEO...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-16 text-center text-stone-400">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-stone-200 font-semibold mb-2">{error || "Sản phẩm không tồn tại"}</p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-xs text-[#C5A880] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Quay lại danh mục sản phẩm
        </Link>
      </div>
    );
  }

  return <ProductEditorForm initialProduct={product} isNew={false} />;
}
