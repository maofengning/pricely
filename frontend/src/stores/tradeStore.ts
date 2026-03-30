import { create } from 'zustand';
import type { Position, Fund, Order } from '@/types';

interface TradeState {
  positions: Position[];
  orders: Order[];
  fund: Fund | null;
  isLoading: boolean;
  setPositions: (positions: Position[]) => void;
  setOrders: (orders: Order[]) => void;
  setFund: (fund: Fund) => void;
  setLoading: (loading: boolean) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  positions: [],
  orders: [],
  fund: null,
  isLoading: false,
  setPositions: (positions) => set({ positions }),
  setOrders: (orders) => set({ orders }),
  setFund: (fund) => set({ fund }),
  setLoading: (loading) => set({ isLoading: loading }),
  addOrder: (order) => set((state) => ({ orders: [...state.orders, order] })),
  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    })),
}));