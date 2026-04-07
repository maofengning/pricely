import { useState } from 'react';
import type { Order, OrderStatus } from '@/types';

interface OrderBookProps {
  orders: Order[];
  isLoading?: boolean;
  onCancelOrder?: (orderId: string) => Promise<void>;
}

function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return '待成交';
    case 'filled':
      return '已成交';
    case 'cancelled':
      return '已取消';
    default:
      return status;
  }
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-400';
    case 'filled':
      return 'text-buy';
    case 'cancelled':
      return 'text-text-secondary';
    default:
      return 'text-text-secondary';
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderBook({ orders, isLoading = false, onCancelOrder }: OrderBookProps) {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const filteredOrders = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  const handleCancel = async (orderId: string) => {
    if (!onCancelOrder) return;
    setCancellingId(orderId);
    try {
      await onCancelOrder(orderId);
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex items-center gap-2 text-text-secondary">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filter === 'all'
              ? 'bg-text-accent text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
          }`}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-500 text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
          }`}
        >
          待成交
        </button>
        <button
          onClick={() => setFilter('filled')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filter === 'filled'
              ? 'bg-buy text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
          }`}
        >
          已成交
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            filter === 'cancelled'
              ? 'bg-text-secondary text-white'
              : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
          }`}
        >
          已取消
        </button>
      </div>

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-text-secondary">
          <svg
            className="w-12 h-12 mb-2 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-sm border-b border-border">
                <th className="text-left py-3 px-2">股票代码</th>
                <th className="text-left py-3 px-2">方向</th>
                <th className="text-left py-3 px-2">方式</th>
                <th className="text-right py-3 px-2">数量</th>
                <th className="text-right py-3 px-2">限价</th>
                <th className="text-right py-3 px-2">成交价</th>
                <th className="text-left py-3 px-2">状态</th>
                <th className="text-left py-3 px-2">时间</th>
                <th className="text-right py-3 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-bg-tertiary transition-colors"
                >
                  <td className="py-3 px-2 text-text-primary font-medium">
                    {order.stockCode}
                  </td>
                  <td
                    className={`py-3 px-2 font-medium ${
                      order.orderType === 'buy' ? 'text-buy' : 'text-sell'
                    }`}
                  >
                    {order.orderType === 'buy' ? '买入' : '卖出'}
                  </td>
                  <td className="py-3 px-2 text-text-secondary">
                    {order.orderMode === 'market' ? '市价' : '限价'}
                  </td>
                  <td className="py-3 px-2 text-text-primary text-right">
                    {order.quantity}
                  </td>
                  <td className="py-3 px-2 text-text-secondary text-right">
                    {order.limitPrice !== undefined && order.limitPrice !== null
                      ? order.limitPrice.toFixed(2)
                      : '--'}
                  </td>
                  <td className="py-3 px-2 text-text-primary text-right">
                    {order.filledPrice !== undefined && order.filledPrice !== null
                      ? order.filledPrice.toFixed(2)
                      : '--'}
                  </td>
                  <td className={`py-3 px-2 ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </td>
                  <td className="py-3 px-2 text-text-secondary text-sm">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {order.status === 'pending' && onCancelOrder && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-2 py-1 text-sm text-sell hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {cancellingId === order.id ? '取消中...' : '取消'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}