import { useState, useCallback } from 'react';
import type { OrderType, OrderMode, OrderCreate } from '@/types';

interface OrderFormProps {
  stockCode?: string;
  onSubmit?: (order: OrderCreate) => Promise<void>;
  isSubmitting?: boolean;
}

interface FormErrors {
  stockCode?: string;
  quantity?: string;
  limitPrice?: string;
}

export function OrderForm({
  stockCode: initialStockCode = '',
  onSubmit,
  isSubmitting = false,
}: OrderFormProps) {
  const [stockCode, setStockCode] = useState(initialStockCode);
  const [orderType, setOrderType] = useState<OrderType>('buy');
  const [orderMode, setOrderMode] = useState<OrderMode>('market');
  const [quantity, setQuantity] = useState<number>(100);
  const [limitPrice, setLimitPrice] = useState<number | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!stockCode.trim()) {
      newErrors.stockCode = '请输入股票代码';
    }

    if (quantity <= 0) {
      newErrors.quantity = '数量必须大于0';
    } else if (quantity % 100 !== 0) {
      newErrors.quantity = '数量必须是100的整数倍';
    }

    if (orderMode === 'limit') {
      if (!limitPrice || limitPrice <= 0) {
        newErrors.limitPrice = '限价必须大于0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [stockCode, quantity, orderMode, limitPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !onSubmit) {
      return;
    }

    const orderData: OrderCreate = {
      stockCode: stockCode.trim(),
      orderType,
      orderMode,
      quantity,
      ...(orderMode === 'limit' && limitPrice && { limitPrice }),
    };

    try {
      await onSubmit(orderData);
      // Reset form after successful submission
      setQuantity(100);
      setLimitPrice('');
      setErrors({});
    } catch {
      // Error handling is done by the parent component
    }
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (value === '' || isNaN(num)) {
      setQuantity(0);
    } else {
      setQuantity(num);
    }
  };

  const handleLimitPriceChange = (value: string) => {
    const num = parseFloat(value);
    if (value === '') {
      setLimitPrice('');
    } else if (!isNaN(num)) {
      setLimitPrice(num);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stock Code */}
      <div>
        <label className="block text-text-secondary text-sm mb-2">股票代码</label>
        <input
          type="text"
          value={stockCode}
          onChange={(e) => setStockCode(e.target.value.toUpperCase())}
          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
          placeholder="例如：600000"
          disabled={isSubmitting}
        />
        {errors.stockCode && (
          <p className="mt-1 text-sm text-red-400">{errors.stockCode}</p>
        )}
      </div>

      {/* Order Type */}
      <div>
        <label className="block text-text-secondary text-sm mb-2">交易方向</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-2 rounded font-medium transition-colors ${
              orderType === 'buy'
                ? 'bg-buy text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
            disabled={isSubmitting}
          >
            买入
          </button>
          <button
            type="button"
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-2 rounded font-medium transition-colors ${
              orderType === 'sell'
                ? 'bg-sell text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
            disabled={isSubmitting}
          >
            卖出
          </button>
        </div>
      </div>

      {/* Order Mode */}
      <div>
        <label className="block text-text-secondary text-sm mb-2">委托方式</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOrderMode('market')}
            className={`flex-1 py-2 rounded text-sm transition-colors ${
              orderMode === 'market'
                ? 'bg-text-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
            disabled={isSubmitting}
          >
            市价
          </button>
          <button
            type="button"
            onClick={() => setOrderMode('limit')}
            className={`flex-1 py-2 rounded text-sm transition-colors ${
              orderMode === 'limit'
                ? 'bg-text-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
            disabled={isSubmitting}
          >
            限价
          </button>
        </div>
      </div>

      {/* Limit Price */}
      {orderMode === 'limit' && (
        <div>
          <label className="block text-text-secondary text-sm mb-2">限价</label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => handleLimitPriceChange(e.target.value)}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
            placeholder="请输入限价"
            disabled={isSubmitting}
          />
          {errors.limitPrice && (
            <p className="mt-1 text-sm text-red-400">{errors.limitPrice}</p>
          )}
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-text-secondary text-sm mb-2">数量（股）</label>
        <input
          type="number"
          value={quantity || ''}
          onChange={(e) => handleQuantityChange(e.target.value)}
          step="100"
          min="100"
          className="w-full px-3 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent"
          placeholder="请输入数量（100的整数倍）"
          disabled={isSubmitting}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => setQuantity((q) => q + 100)}
            className="flex-1 py-1 text-sm bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary"
            disabled={isSubmitting}
          >
            +100
          </button>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(100, q - 100))}
            className="flex-1 py-1 text-sm bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary"
            disabled={isSubmitting}
          >
            -100
          </button>
        </div>
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-3 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          orderType === 'buy'
            ? 'bg-buy text-white hover:bg-green-600'
            : 'bg-sell text-white hover:bg-red-600'
        }`}
      >
        {isSubmitting ? '提交中...' : orderType === 'buy' ? '买入' : '卖出'}
      </button>
    </form>
  );
}