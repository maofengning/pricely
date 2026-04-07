import { useState, useCallback, useEffect } from 'react';
import { OrderForm } from './OrderForm';
import { PositionManager } from './PositionManager';
import { OrderBook } from './OrderBook';
import { FundManager } from './FundManager';
import { TradeReport } from './TradeReport';
import { useTrade } from '@/hooks';
import { useChartStore } from '@/stores';
import { wsService } from '@/services/websocket';
import type { OrderCreate, Order } from '@/types';

type TabType = 'positions' | 'orders' | 'fund' | 'report';

interface TradePanelProps {
  className?: string;
}

interface TradeNotification {
  type: 'order_filled' | 'order_pending' | 'position_update';
  orderId?: string;
  stockCode?: string;
  message: string;
}

export function TradePanel({ className = '' }: TradePanelProps) {
  const { stockCode } = useChartStore();
  const [activeTab, setActiveTab] = useState<TabType>('positions');
  const [notification, setNotification] = useState<TradeNotification | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    positions,
    orders,
    fund,
    isLoading,
    error,
    createOrder,
    cancelOrder,
    resetFund,
    fetchAll,
  } = useTrade();

  // Handle WebSocket trade notifications
  useEffect(() => {
    const unsubOrderFilled = wsService.on('order_filled', (data) => {
      const notificationData = data as TradeNotification;
      setNotification({
        type: 'order_filled',
        orderId: notificationData.orderId,
        message: notificationData.message || '订单已成交',
      });
      // Refresh data after order is filled
      fetchAll();
    });

    const unsubPositionUpdate = wsService.on('position_update', () => {
      fetchAll();
    });

    return () => {
      unsubOrderFilled();
      unsubPositionUpdate();
    };
  }, [fetchAll]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSubmitOrder = useCallback(
    async (orderData: OrderCreate) => {
      setSubmitting(true);
      try {
        const order: Order = await createOrder(orderData);
        setNotification({
          type: order.status === 'filled' ? 'order_filled' : 'order_pending',
          orderId: order.id,
          stockCode: order.stockCode,
          message:
            order.status === 'filled'
              ? `${order.stockCode} ${order.orderType === 'buy' ? '买入' : '卖出'} 成交`
              : `${order.stockCode} 限价单已提交`,
        });
      } catch {
        // Error is handled by useTrade hook
      } finally {
        setSubmitting(false);
      }
    },
    [createOrder]
  );

  const handleCancelOrder = useCallback(
    async (orderId: string) => {
      await cancelOrder(orderId);
      setNotification({
        type: 'order_pending',
        orderId,
        message: '订单已取消',
      });
    },
    [cancelOrder]
  );

  const tabs: { id: TabType; label: string }[] = [
    { id: 'positions', label: '持仓管理' },
    { id: 'orders', label: '订单列表' },
    { id: 'fund', label: '资金管理' },
    { id: 'report', label: '交易报表' },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            notification.type === 'order_filled'
              ? 'bg-buy/20 border border-buy'
              : 'bg-yellow-500/20 border border-yellow-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'order_filled' && (
              <svg className="w-5 h-5 text-buy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className="text-text-primary">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-sell/20 border border-sell rounded-lg">
          <p className="text-sell">{error}</p>
        </div>
      )}

      {/* Order Form Section */}
      <div className="bg-bg-secondary rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium text-text-primary mb-4">下单</h2>
        <OrderForm
          stockCode={stockCode || ''}
          onSubmit={handleSubmitOrder}
          isSubmitting={submitting}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-text-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-bg-secondary rounded-lg p-4 flex-1 overflow-hidden">
        {activeTab === 'positions' && (
          <PositionManager positions={positions} isLoading={isLoading} />
        )}
        {activeTab === 'orders' && (
          <OrderBook
            orders={orders}
            isLoading={isLoading}
            onCancelOrder={handleCancelOrder}
          />
        )}
        {activeTab === 'fund' && (
          <FundManager
            fund={fund}
            isLoading={isLoading}
            onReset={resetFund}
          />
        )}
        {activeTab === 'report' && <TradeReport isLoading={isLoading} />}
      </div>
    </div>
  );
}