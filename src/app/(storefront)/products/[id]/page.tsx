import ProductDetailView from "@/components/hanoia/ProductDetailView";
import { productMetadata, requireProduct } from "@/lib/server/productPage";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  return productMetadata((await params).id);
}

export default async function ProductPage({ params }: Props) {
  const id = (await params).id;
  await requireProduct(id);
  return <ProductDetailView idOrSlug={id} />;
}
