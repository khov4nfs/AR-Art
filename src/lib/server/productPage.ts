import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDatabase } from "@/lib/store";

/** Server-side existence check so unknown product URLs return a real 404. */
export async function requireProduct(idOrSlug: string) {
  const db = await getDatabase();
  const product = db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!product) notFound();
  return product;
}

export async function productMetadata(idOrSlug: string): Promise<Metadata> {
  const db = await getDatabase();
  const product = db.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!product) return { title: "Không tìm thấy sản phẩm | EVERIE", robots: { index: false } };
  const title = product.seoTitle || `${product.name} | EVERIE`;
  const description = product.seoDescription || product.description?.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, images: [product.seoOgImage || product.image] },
  };
}
