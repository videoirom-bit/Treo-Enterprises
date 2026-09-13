import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider, useApp } from '../../context/AppContext';

// Test consumer component that exercises AppContext GST computation and inventory deduction
const TestShoppingComponent: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    cartGSTDetails,
    createOrder,
    shopSettings,
  } = useApp();

  const handlePlaceTestOrder = () => {
    if (cart.length === 0) return;

    createOrder({
      customer: {
        name: 'Rohan Sharma',
        mobile: '9876543210',
        email: 'rohan@example.com',
        city: 'Raipur',
        state: shopSettings.state,
      },
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        mrp: item.product.mrp,
        sellingPrice: item.product.sellingPrice,
        taxableAmount: item.product.sellingPrice * item.quantity * 0.85,
        gstRate: item.product.gstRate,
        cgst: 5,
        sgst: 5,
        igst: 0,
        totalTax: 10,
        totalAmount: item.product.sellingPrice * item.quantity,
        unit: item.product.unit,
      })),
      taxableAmount: cartGSTDetails.taxableAmount,
      cgst: cartGSTDetails.cgst,
      sgst: cartGSTDetails.sgst,
      igst: cartGSTDetails.igst,
      totalTax: cartGSTDetails.totalTax,
      deliveryCharge: 0,
      roundOff: cartGSTDetails.roundOff,
      grandTotal: cartGSTDetails.grandTotal,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      orderStatus: 'Delivered',
      fulfillmentType: 'Store Pickup',
    });
  };

  const sampleProduct = products[0];

  return (
    <div data-testid="test-root">
      <div data-testid="shop-state">{shopSettings.state}</div>
      <div data-testid="product-name">{sampleProduct?.name}</div>
      <div data-testid="product-stock">{sampleProduct?.currentStock}</div>

      <div data-testid="cart-count">{cart.length}</div>
      <div data-testid="cart-taxable">{cartGSTDetails.taxableAmount}</div>
      <div data-testid="cart-cgst">{cartGSTDetails.cgst}</div>
      <div data-testid="cart-sgst">{cartGSTDetails.sgst}</div>
      <div data-testid="cart-igst">{cartGSTDetails.igst}</div>
      <div data-testid="cart-grandtotal">{cartGSTDetails.grandTotal}</div>

      <button
        data-testid="add-btn"
        onClick={() => sampleProduct && addToCart(sampleProduct, 2)}
      >
        Add 2 to Cart
      </button>

      <button data-testid="order-btn" onClick={handlePlaceTestOrder}>
        Place Order
      </button>
    </div>
  );
};

describe('React Integration: GST Engine & Inventory Deduction (React Testing Library)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should calculate GST in real-time when items are added to cart and decrement stock upon order placement', async () => {
    render(
      <AppProvider>
        <TestShoppingComponent />
      </AppProvider>
    );

    // 1. Initial State assertions
    const initialStockText = screen.getByTestId('product-stock').textContent;
    const initialStock = Number(initialStockText);
    expect(initialStock).toBeGreaterThan(0);
    expect(screen.getByTestId('cart-count').textContent).toBe('0');
    expect(screen.getByTestId('cart-grandtotal').textContent).toBe('0');

    // 2. Add product to cart
    await act(async () => {
      fireEvent.click(screen.getByTestId('add-btn'));
    });

    // 3. Cart & GST Assertions
    expect(screen.getByTestId('cart-count').textContent).toBe('1');
    const taxableAfterAdd = Number(screen.getByTestId('cart-taxable').textContent);
    const grandTotalAfterAdd = Number(screen.getByTestId('cart-grandtotal').textContent);
    const cgst = Number(screen.getByTestId('cart-cgst').textContent);
    const sgst = Number(screen.getByTestId('cart-sgst').textContent);

    expect(taxableAfterAdd).toBeGreaterThan(0);
    expect(grandTotalAfterAdd).toBeGreaterThan(taxableAfterAdd);
    // Intra-state split check: CGST and SGST must match and be > 0
    expect(cgst).toBeGreaterThan(0);
    expect(sgst).toBe(cgst);

    // 4. Place order and verify that inventory is decremented by 2
    await act(async () => {
      fireEvent.click(screen.getByTestId('order-btn'));
    });

    const newStock = Number(screen.getByTestId('product-stock').textContent);
    expect(newStock).toBe(initialStock - 2);
  });

  it('should prevent adding out of stock products and enforce stock ceilings', async () => {
    const TestOutOfStockComponent: React.FC = () => {
      const { products, addToCart, cart, toastMessage } = useApp();
      const outOfStockProd = {
        ...products[0],
        id: 'out-of-stock-sku',
        name: 'Defunct Ink',
        currentStock: 0,
      };

      return (
        <div>
          <div data-testid="toast-msg">{toastMessage}</div>
          <div data-testid="cart-len">{cart.length}</div>
          <button
            data-testid="add-oos-btn"
            onClick={() => addToCart(outOfStockProd, 1)}
          >
            Add OOS
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <TestOutOfStockComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('cart-len').textContent).toBe('0');

    await act(async () => {
      fireEvent.click(screen.getByTestId('add-oos-btn'));
    });

    expect(screen.getByTestId('cart-len').textContent).toBe('0');
    expect(screen.getByTestId('toast-msg').textContent).toContain('out of stock');
  });

  it('should accurately deduct stock across multiple distinct products in a multi-item order', async () => {
    const TestMultiItemOrderComponent: React.FC = () => {
      const { products, createOrder, shopSettings } = useApp();
      const prodA = products[0];
      const prodB = products[1];

      const placeOrder = () => {
        createOrder({
          customer: {
            name: 'Pooja Verma',
            mobile: '9123456780',
            city: 'Raipur',
            state: shopSettings.state,
          },
          items: [
            {
              productId: prodA.id,
              productName: prodA.name,
              sku: prodA.sku,
              quantity: 3,
              mrp: prodA.mrp,
              sellingPrice: prodA.sellingPrice,
              taxableAmount: prodA.sellingPrice * 3 * 0.85,
              gstRate: prodA.gstRate,
              cgst: 5,
              sgst: 5,
              igst: 0,
              totalTax: 10,
              totalAmount: prodA.sellingPrice * 3,
              unit: prodA.unit,
            },
            {
              productId: prodB.id,
              productName: prodB.name,
              sku: prodB.sku,
              quantity: 4,
              mrp: prodB.mrp,
              sellingPrice: prodB.sellingPrice,
              taxableAmount: prodB.sellingPrice * 4 * 0.85,
              gstRate: prodB.gstRate,
              cgst: 5,
              sgst: 5,
              igst: 0,
              totalTax: 10,
              totalAmount: prodB.sellingPrice * 4,
              unit: prodB.unit,
            },
          ],
          taxableAmount: 100,
          cgst: 9,
          sgst: 9,
          igst: 0,
          totalTax: 18,
          deliveryCharge: 0,
          roundOff: 0,
          grandTotal: 118,
          paymentMethod: 'UPI',
          paymentStatus: 'Paid',
          orderStatus: 'Confirmed',
          fulfillmentType: 'Store Pickup',
        });
      };

      return (
        <div>
          <div data-testid="stock-a">{prodA.currentStock}</div>
          <div data-testid="stock-b">{prodB.currentStock}</div>
          <button data-testid="place-multi-order" onClick={placeOrder}>
            Place Multi Order
          </button>
        </div>
      );
    };

    render(
      <AppProvider>
        <TestMultiItemOrderComponent />
      </AppProvider>
    );

    const initialA = Number(screen.getByTestId('stock-a').textContent);
    const initialB = Number(screen.getByTestId('stock-b').textContent);

    await act(async () => {
      fireEvent.click(screen.getByTestId('place-multi-order'));
    });

    const finalA = Number(screen.getByTestId('stock-a').textContent);
    const finalB = Number(screen.getByTestId('stock-b').textContent);

    expect(finalA).toBe(initialA - 3);
    expect(finalB).toBe(initialB - 4);
  });
});
