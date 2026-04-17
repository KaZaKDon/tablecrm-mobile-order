import type { ProductItem } from "@/types/tablecrm";

export function addProductToCart(items: ProductItem[], product: ProductItem) {
  const existing = items.find((item) => item.id === product.id);
  if (existing) {
    return items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
  }
  return [...items, product];
}

export function updateCartItem(items: ProductItem[], productId: number, patch: Partial<ProductItem>) {
  return items.map((item) => {
    if (item.id !== productId) return item;
    return {
      ...item,
      ...patch,
      quantity: Math.max(1, Number(patch.quantity ?? item.quantity) || 1),
      price: Math.max(0, Number(patch.price ?? item.price) || 0),
    };
  });
}

export function removeCartItem(items: ProductItem[], productId: number) {
  return items.filter((item) => item.id !== productId);
}

export function calcCartTotal(items: ProductItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
