import ProductDetailView from "@/components/hanoia/ProductDetailView";
import { productMetadata, requireProduct } from "@/lib/server/productPage";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return productMetadata((await params).slug);
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  await requireProduct(slug);
  return <ProductDetailView idOrSlug={slug} />;
}
