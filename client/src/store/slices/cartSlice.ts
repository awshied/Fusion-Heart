import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  itemType: "BOOK" | "BEVERAGE";
  image?: string;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  storeId: null,
  isLoading: false,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (
      state,
      action: PayloadAction<{ items: CartItem[]; storeId: string | null }>,
    ) => {
      state.items = action.payload.items;
      state.storeId = action.payload.storeId;
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingIndex = state.items.findIndex(
        (item) =>
          item.itemId === action.payload.itemId &&
          item.itemType === action.payload.itemType,
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number }>,
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearCart: (state) => {
      state.items = [];
      state.storeId = null;
    },
    setStoreId: (state, action: PayloadAction<string | null>) => {
      state.storeId = action.payload;
    },
  },
});

export const {
  setCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  setStoreId,
} = cartSlice.actions;
export default cartSlice.reducer;
