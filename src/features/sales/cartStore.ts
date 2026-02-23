import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  contactId: string | null;
  contactName: string | null;
  notes: string;

  addItem: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateDiscount: (productId: string, discountPercent: number) => void;
  setContact: (contactId: string | null, contactName: string | null) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  getSubtotal: () => number;
  getTaxAmount: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

function calculateLineTotal(qty: number, price: number, discount: number, tax: number): number {
  const subtotal = qty * price;
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (tax / 100);
  return afterDiscount + taxAmount;
}

export const useCartStore = create<CartState>()(
  immer((set, get) => ({
    items: [],
    contactId: null,
    contactName: null,
    notes: '',

    addItem: (item) => {
      set((state) => {
        const existing = state.items.find((i) => i.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
          existing.lineTotal = calculateLineTotal(
            existing.quantity,
            existing.unitPrice,
            existing.discountPercent,
            existing.taxPercent
          );
        } else {
          const id = `${item.productId}-${Date.now()}`;
          const lineTotal = calculateLineTotal(
            item.quantity,
            item.unitPrice,
            item.discountPercent,
            item.taxPercent
          );
          state.items.push({ ...item, id, lineTotal });
        }
      });
    },

    updateQuantity: (productId, quantity) => {
      set((state) => {
        const item = state.items.find((i) => i.productId === productId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((i) => i.productId !== productId);
          } else {
            item.quantity = quantity;
            item.lineTotal = calculateLineTotal(
              item.quantity,
              item.unitPrice,
              item.discountPercent,
              item.taxPercent
            );
          }
        }
      });
    },

    removeItem: (productId) => {
      set((state) => {
        state.items = state.items.filter((i) => i.productId !== productId);
      });
    },

    updateDiscount: (productId, discountPercent) => {
      set((state) => {
        const item = state.items.find((i) => i.productId === productId);
        if (item) {
          item.discountPercent = discountPercent;
          item.lineTotal = calculateLineTotal(
            item.quantity,
            item.unitPrice,
            item.discountPercent,
            item.taxPercent
          );
        }
      });
    },

    setContact: (contactId, contactName) => {
      set((state) => {
        state.contactId = contactId;
        state.contactName = contactName;
      });
    },

    setNotes: (notes) => {
      set((state) => {
        state.notes = notes;
      });
    },

    clearCart: () => {
      set((state) => {
        state.items = [];
        state.contactId = null;
        state.contactName = null;
        state.notes = '';
      });
    },

    getSubtotal: () => {
      return get().items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    },

    getTaxAmount: () => {
      return get().items.reduce((sum, item) => {
        const subtotal = item.quantity * item.unitPrice;
        const discount = subtotal * (item.discountPercent / 100);
        const afterDiscount = subtotal - discount;
        return sum + afterDiscount * (item.taxPercent / 100);
      }, 0);
    },

    getDiscountAmount: () => {
      return get().items.reduce((sum, item) => {
        return sum + item.quantity * item.unitPrice * (item.discountPercent / 100);
      }, 0);
    },

    getTotal: () => {
      return get().items.reduce((sum, item) => sum + item.lineTotal, 0);
    },

    getItemCount: () => {
      return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },
  }))
);
