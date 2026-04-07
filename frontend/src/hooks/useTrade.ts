import { useState, useCallback, useEffect } from 'react';
import { tradeService } from '@/services/trade';
import { useTradeStore } from '@/stores';
import type { OrderCreate, TradeReport, OrderStatus, ReportPeriodType } from '@/types';

interface UseTradeOptions {
  autoFetch?: boolean;
}

export function useTrade(options: UseTradeOptions = {}) {
  const { autoFetch = true } = options;
  const {
    positions,
    orders,
    fund,
    isLoading,
    setPositions,
    setOrders,
    setFund,
    setLoading,
    addOrder,
    updateOrder,
  } = useTradeStore();

  const [error, setError] = useState<string | null>(null);

  // Fetch all trade data
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [positionsData, ordersData, fundData] = await Promise.all([
        tradeService.listPositions(),
        tradeService.listOrders(),
        tradeService.getFund(),
      ]);
      setPositions(positionsData);
      setOrders(ordersData);
      setFund(fundData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取交易数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setPositions, setOrders, setFund, setLoading]);

  // Create order
  const createOrder = useCallback(
    async (data: OrderCreate) => {
      setLoading(true);
      setError(null);
      try {
        const order = await tradeService.createOrder({
          stockCode: data.stockCode,
          orderType: data.orderType,
          orderMode: data.orderMode,
          quantity: data.quantity,
          limitPrice: data.limitPrice,
        });
        addOrder(order);
        // Refresh positions and fund after order
        const [positionsData, fundData] = await Promise.all([
          tradeService.listPositions(),
          tradeService.getFund(),
        ]);
        setPositions(positionsData);
        setFund(fundData);
        return order;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '下单失败';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [addOrder, setPositions, setFund, setLoading]
  );

  // Cancel order
  const cancelOrder = useCallback(
    async (orderId: string) => {
      setLoading(true);
      setError(null);
      try {
        await tradeService.cancelOrder(orderId);
        updateOrder(orderId, { status: 'cancelled' });
        // Refresh fund after cancellation
        const fundData = await tradeService.getFund();
        setFund(fundData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '取消订单失败';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [updateOrder, setFund, setLoading]
  );

  // Fetch orders
  const fetchOrders = useCallback(
    async (status?: OrderStatus) => {
      setLoading(true);
      setError(null);
      try {
        const data = await tradeService.listOrders(status);
        setOrders(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '获取订单列表失败';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [setOrders, setLoading]
  );

  // Fetch positions
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tradeService.listPositions();
      setPositions(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取持仓失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setPositions, setLoading]);

  // Fetch fund
  const fetchFund = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tradeService.getFund();
      setFund(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取资金信息失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setFund, setLoading]);

  // Reset fund
  const resetFund = useCallback(
    async (initialCapital: number) => {
      setLoading(true);
      setError(null);
      try {
        await tradeService.resetFund({ initialCapital });
        // Refresh all data after reset
        await fetchAll();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '重置资金失败';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAll, setLoading]
  );

  // Auto fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchAll();
    }
  }, [autoFetch, fetchAll]);

  return {
    positions,
    orders,
    fund,
    isLoading,
    error,
    fetchAll,
    createOrder,
    cancelOrder,
    fetchOrders,
    fetchPositions,
    fetchFund,
    resetFund,
  };
}

export function useTradeReports(periodType?: ReportPeriodType) {
  const [reports, setReports] = useState<TradeReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tradeService.getReports(periodType);
      setReports(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取交易报表失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [periodType]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, isLoading, error, refetch: fetchReports };
}