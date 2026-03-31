import { useEffect, useState } from 'react';
import { api } from '@/services/api';

interface TradeLog {
  id: string;
  stockCode: string;
  stockName?: string;
  period: string;
  patternType?: string;
  entryPrice: number;
  exitPrice?: number;
  profitLoss?: number;
  notes?: string;
  createdAt: string;
}

export default function LogPage() {
  const [logs, setLogs] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await api.get<TradeLog[]>('/logs');
        setLogs(data);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-4">交易日志</h1>

      {loading ? (
        <div className="text-text-secondary">加载中...</div>
      ) : logs.length === 0 ? (
        <div className="text-text-secondary">暂无交易日志</div>
      ) : (
        <div className="bg-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-text-secondary text-sm">股票</th>
                <th className="px-4 py-3 text-left text-text-secondary text-sm">周期</th>
                <th className="px-4 py-3 text-left text-text-secondary text-sm">入场价</th>
                <th className="px-4 py-3 text-left text-text-secondary text-sm">出场价</th>
                <th className="px-4 py-3 text-left text-text-secondary text-sm">盈亏</th>
                <th className="px-4 py-3 text-left text-text-secondary text-sm">时间</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary">
                  <td className="px-4 py-3 text-text-primary">{log.stockCode}</td>
                  <td className="px-4 py-3 text-text-secondary">{log.period}</td>
                  <td className="px-4 py-3 text-text-primary">{log.entryPrice}</td>
                  <td className="px-4 py-3 text-text-primary">{log.exitPrice || '-'}</td>
                  <td className={`px-4 py-3 ${log.profitLoss && log.profitLoss >= 0 ? 'text-kline-up' : 'text-kline-down'}`}>
                    {log.profitLoss !== undefined ? `${log.profitLoss >= 0 ? '+' : ''}${log.profitLoss}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-text-secondary text-sm">
                    {new Date(log.createdAt).toLocaleDateString('zh-CN')}
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