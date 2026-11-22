import {
  type CraftSettings,
  craftDaysForLine,
  expectedReceiveRange,
} from "@/lib/everie";

export function productReceiveRange(
  product: {
    line?: string;
    craftDaysMin?: number;
    craftDaysMax?: number;
  },
  settings?: CraftSettings,
): { min: number; max: number } {
  const craft = craftDaysForLine(product.line, settings);
  return expectedReceiveRange(
    craft.min,
    craft.max,
    settings?.shippingDaysMin,
    settings?.shippingDaysMax,
  );
}

export function cartReceiveRange(
  items: {
    product: {
      line?: string;
      craftDaysMin?: number;
      craftDaysMax?: number;
    };
  }[],
  settings?: CraftSettings,
): { min: number; max: number } {
  if (items.length === 0) return { min: 0, max: 0 };
  const ranges = items.map((item) =>
    productReceiveRange(item.product, settings),
  );
  return {
    min: Math.max(...ranges.map((range) => range.min)),
    max: Math.max(...ranges.map((range) => range.max)),
  };
}
