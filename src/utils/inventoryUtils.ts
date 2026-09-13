import { Product } from '../types';

export interface StockValidationResult {
  valid: boolean;
  errors: string[];
}

export interface StockDeductionReport {
  updatedProducts: Product[];
  deductedItems: Array<{
    productId: string;
    productName: string;
    previousStock: number;
    newStock: number;
    quantityDeducted: number;
    isOutOfStock: boolean;
    isLowStock: boolean;
  }>;
}

/**
 * Validates that all requested items are in stock and have sufficient quantity.
 */
export function validateStockAvailability(
  products: Product[],
  requestedItems: Array<{ productId: string; quantity: number }>
): StockValidationResult {
  const errors: string[] = [];

  for (const item of requestedItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      errors.push(`Product with ID "${item.productId}" was not found in catalog.`);
      continue;
    }

    if (product.currentStock <= 0) {
      errors.push(`"${product.name}" is completely out of stock.`);
    } else if (item.quantity > product.currentStock) {
      errors.push(
        `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.currentStock}.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Deducts inventory based on items in an order.
 * Ensures stock levels never drop below zero.
 */
export function deductInventory(
  products: Product[],
  orderItems: Array<{ productId: string; quantity: number }>
): Product[] {
  return products.map((prod) => {
    const matchedItem = orderItems.find((item) => item.productId === prod.id);
    if (matchedItem) {
      const updatedStock = Math.max(0, prod.currentStock - matchedItem.quantity);
      return {
        ...prod,
        currentStock: updatedStock,
      };
    }
    return prod;
  });
}

/**
 * Deducts inventory and returns a detailed audit report.
 */
export function deductInventoryWithAudit(
  products: Product[],
  orderItems: Array<{ productId: string; quantity: number }>
): StockDeductionReport {
  const deductedItems: StockDeductionReport['deductedItems'] = [];

  const updatedProducts = products.map((prod) => {
    const matchedItem = orderItems.find((item) => item.productId === prod.id);
    if (matchedItem) {
      const updatedStock = Math.max(0, prod.currentStock - matchedItem.quantity);
      const isOutOfStock = updatedStock <= 0;
      const isLowStock = updatedStock > 0 && updatedStock <= prod.minimumStock;

      deductedItems.push({
        productId: prod.id,
        productName: prod.name,
        previousStock: prod.currentStock,
        newStock: updatedStock,
        quantityDeducted: matchedItem.quantity,
        isOutOfStock,
        isLowStock,
      });

      return {
        ...prod,
        currentStock: updatedStock,
      };
    }
    return prod;
  });

  return {
    updatedProducts,
    deductedItems,
  };
}

/**
 * Restores inventory (e.g. in case of order cancellation or return).
 */
export function restoreInventory(
  products: Product[],
  orderItems: Array<{ productId: string; quantity: number }>
): Product[] {
  return products.map((prod) => {
    const matchedItem = orderItems.find((item) => item.productId === prod.id);
    if (matchedItem) {
      return {
        ...prod,
        currentStock: prod.currentStock + matchedItem.quantity,
      };
    }
    return prod;
  });
}
