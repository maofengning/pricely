import { useEffect, useState, useCallback, useRef } from 'react';
import { wsService } from '@/services/websocket';
import { useUserStore } from '@/stores';

interface UseWebSocketOptions {
  autoConnect?: boolean;
}

interface RealtimePrice {
  stockCode: string;
  price: number;
  time: string;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { autoConnect = true } = options;
  const { token } = useUserStore();
  const [isConnected, setIsConnected] = useState(false);
  const [priceUpdates, setPriceUpdates] = useState<RealtimePrice[]>([]);
  const isConnecting = useRef(false);

  const connect = useCallback(async () => {
    if (isConnecting.current) return;
    isConnecting.current = true;
    try {
      await wsService.connect(token || undefined);
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    } finally {
      isConnecting.current = false;
    }
  }, [token]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
    setIsConnected(false);
  }, []);

  const subscribe = useCallback((stockCode: string) => {
    wsService.subscribe(stockCode);
  }, []);

  const unsubscribe = useCallback((stockCode: string) => {
    wsService.unsubscribe(stockCode);
  }, []);

  useEffect(() => {
    // Subscribe to price updates
    const unsubPriceUpdate = wsService.on('price_update', (data) => {
      const priceData = data as RealtimePrice;
      setPriceUpdates((prev) => {
        // Keep only last 100 updates
        const newUpdates = [priceData, ...prev];
        return newUpdates.slice(0, 100);
      });
    });

    // Auto connect if needed
    if (autoConnect) {
      // Use setTimeout to defer the connect call
      const timer = setTimeout(() => {
        connect();
      }, 0);

      return () => {
        clearTimeout(timer);
        unsubPriceUpdate();
        disconnect();
      };
    }

    return () => {
      unsubPriceUpdate();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    priceUpdates,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}