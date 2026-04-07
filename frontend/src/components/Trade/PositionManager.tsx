import type { Position } from '@/types';

interface PositionManagerProps {
  positions: Position[];
  isLoading?: boolean;
}

function formatProfitLoss(value: number | undefined | null): string {
  if (value === undefined || value === null) return '--';
  return value.toFixed(2);
}

function formatPercent(value: number | undefined | null, avgCost: number): string {
  if (value === undefined || value === null || avgCost === 0) return '--';
  return `${((value - avgCost) / avgCost * 100).toFixed(2)}%`;
}

export function PositionManager({ positions, isLoading = false }: PositionManagerProps) {
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

  if (positions.length === 0) {
    return (
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
        <p>暂无持仓</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-text-secondary text-sm border-b border-border">
            <th className="text-left py-3 px-2">股票代码</th>
            <th className="text-left py-3 px-2">股票名称</th>
            <th className="text-right py-3 px-2">持仓数量</th>
            <th className="text-right py-3 px-2">成本价</th>
            <th className="text-right py-3 px-2">当前价</th>
            <th className="text-right py-3 px-2">盈亏</th>
            <th className="text-right py-3 px-2">盈亏比例</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => {
            const profitLoss = position.profitLoss;
            const isProfit = profitLoss !== null && profitLoss !== undefined && profitLoss >= 0;

            return (
              <tr
                key={position.id}
                className="border-b border-border hover:bg-bg-tertiary transition-colors"
              >
                <td className="py-3 px-2 text-text-primary font-medium">
                  {position.stockCode}
                </td>
                <td className="py-3 px-2 text-text-secondary">
                  {position.stockName || '--'}
                </td>
                <td className="py-3 px-2 text-text-primary text-right">
                  {position.quantity}
                </td>
                <td className="py-3 px-2 text-text-primary text-right">
                  {position.avgCost.toFixed(2)}
                </td>
                <td className="py-3 px-2 text-text-primary text-right">
                  {position.currentPrice !== null && position.currentPrice !== undefined
                    ? position.currentPrice.toFixed(2)
                    : '--'}
                </td>
                <td
                  className={`py-3 px-2 text-right font-medium ${
                    isProfit ? 'text-buy' : 'text-sell'
                  }`}
                >
                  {formatProfitLoss(profitLoss)}
                </td>
                <td
                  className={`py-3 px-2 text-right ${
                    isProfit ? 'text-buy' : 'text-sell'
                  }`}
                >
                  {formatPercent(position.currentPrice, position.avgCost)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}