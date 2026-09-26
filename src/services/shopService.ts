import { BaseService } from './baseService';
import { cartStore } from '../store/cart';
import type { ShopProduct, ShopSelectedOptions } from '../types/shop';

export class CartService extends BaseService {
  readonly name = 'CartService';

  addToCart(product: ShopProduct, selectedOptions?: ShopSelectedOptions, quantity = 1): void {
    cartStore.getState().addItem(product, selectedOptions, quantity);
    this.emit('item_added', product);
    this.log(`Added "${product.title}" to cart`);
  }

  removeFromCart(id: string | number): void {
    cartStore.getState().removeItem(id);
    this.emit('item_removed', { id });
    this.log(`Removed item ${id} from cart`);
  }

  updateQuantity(id: string | number, quantity: number): void {
    cartStore.getState().updateQuantity(id, quantity);
    this.emit('quantity_changed', { id, quantity });
  }

  checkout(): Promise<{ success: boolean; orderId: string }> {
    return new Promise((resolve) => {
      const items = cartStore.getState().items;
      this.emit('checkout_started', { items });
      setTimeout(() => {
        const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
        cartStore.getState().clear();
        this.emit('checkout_completed', { orderId });
        resolve({ success: true, orderId });
      }, 1000);
    });
  }
}

export class TelemetryService extends BaseService {
  readonly name = 'TelemetryService';
  private logs: Array<{ timestamp: string; event: string; payload: any }> = [];

  track(event: string, payload?: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      payload,
    };
    this.logs.push(entry);
    this.emit('track', entry);
  }

  getRecentEvents() {
    return [...this.logs];
  }
}
