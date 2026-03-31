import { useState } from 'react';
import { useUserStore } from '@/stores';
import { api } from '@/services/api';

export function Settings() {
  const { user } = useUserStore();
  const [initialCapital, setInitialCapital] = useState('100000');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResetFund = async () => {
    const capital = parseFloat(initialCapital);
    if (isNaN(capital) || capital < 10000 || capital > 1000000) {
      setMessage('初始资金范围：¥10,000 - ¥1,000,000');
      return;
    }

    setLoading(true);
    try {
      await api.post('/trade/fund/reset', { initialCapital: capital });
      setMessage('资金重置成功！');
    } catch {
      setMessage('资金重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-bg-secondary rounded-lg">
        <p className="text-text-secondary">请先登录</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-secondary rounded-lg">
      <h2 className="text-xl font-bold text-text-primary mb-4">设置</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-text-primary mb-2">模拟资金重置</h3>
          <p className="text-text-secondary text-sm mb-4">
            重置模拟账户资金将清除所有持仓和订单记录。
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">
                初始资金 (¥)
              </label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="px-4 py-2 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:border-text-accent w-48"
                min={10000}
                max={1000000}
                step={10000}
              />
            </div>

            <button
              onClick={handleResetFund}
              disabled={loading}
              className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? '重置中...' : '重置资金'}
            </button>
          </div>

          {message && (
            <p className={`mt-2 text-sm ${message.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}