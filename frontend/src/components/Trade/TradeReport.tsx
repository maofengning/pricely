import { useEffect, useRef } from 'react';
import { createChart, ColorType, LineSeries } from 'lightweight-charts';
import type { IChartApi } from 'lightweight-charts';
import { useTradeReports } from '@/hooks';

interface TradeReportProps {
  isLoading?: boolean;
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null) return '--';
  return `${(value * 100).toFixed(2)}%`;
}

function formatMoney(value: number | undefined | null): string {
  if (value === undefined || value === null) return '--';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

export function TradeReport({ isLoading = false }: TradeReportProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { reports, isLoading: reportsLoading, error } = useTradeReports('daily');

  const isLoadingState = isLoading || reportsLoading;

  // Sort reports by date
  const sortedReports = [...reports].sort((a, b) =>
    new Date(a.periodDate).getTime() - new Date(b.periodDate).getTime()
  );

  useEffect(() => {
    if (!chartContainerRef.current || sortedReports.length === 0) return;

    // Create chart
    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#2a2e39' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: 200,
      grid: {
        vertLines: { color: '#363a45' },
        horzLines: { color: '#363a45' },
      },
    });

    // Add net profit line
    const netProfitSeries = chartRef.current.addSeries(LineSeries, {
      color: '#2962ff',
      lineWidth: 2,
    });

    // Set data
    netProfitSeries.setData(
      sortedReports.map((report) => ({
        time: new Date(report.periodDate).toISOString().split('T')[0],
        value: Number(report.netProfit),
      }))
    );

    // Fit content
    chartRef.current.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
    };
  }, [sortedReports]);

  if (isLoadingState) {
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-sell">
        <p>{error}</p>
      </div>
    );
  }

  if (sortedReports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-text-secondary">
        <p>暂无交易报表数据</p>
      </div>
    );
  }

  // Calculate summary
  const totalTrades = sortedReports.reduce((sum, r) => sum + r.tradeCount, 0);
  const totalWins = sortedReports.reduce((sum, r) => sum + r.winCount, 0);
  const totalProfit = sortedReports.reduce((sum, r) => sum + Number(r.totalProfit), 0);
  const totalLoss = sortedReports.reduce((sum, r) => sum + Number(r.totalLoss), 0);
  const overallWinRate = totalTrades > 0 ? totalWins / totalTrades : 0;
  const overallNetProfit = sortedReports.reduce((sum, r) => sum + Number(r.netProfit), 0);
  const maxDrawdown = Math.max(...sortedReports.map((r) => Number(r.maxDrawdown)));

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">总交易次数</p>
          <p className="text-text-primary font-medium">{totalTrades}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">胜率</p>
          <p className={`font-medium ${overallWinRate >= 0.5 ? 'text-buy' : 'text-sell'}`}>
            {formatPercent(overallWinRate)}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">总盈利</p>
          <p className="text-buy font-medium">{formatMoney(totalProfit)}</p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">总亏损</p>
          <p className="text-sell font-medium">{formatMoney(totalLoss)}</p>
        </div>
      </div>

      {/* Net Profit Chart */}
      <div className="mb-4">
        <h3 className="text-text-secondary text-sm mb-2">累计盈亏曲线</h3>
        <div
          ref={chartContainerRef}
          className="w-full h-[200px] bg-bg-tertiary rounded-lg"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">累计净盈亏</p>
          <p className={`font-medium ${overallNetProfit >= 0 ? 'text-buy' : 'text-sell'}`}>
            {formatMoney(overallNetProfit)}
          </p>
        </div>
        <div className="bg-bg-tertiary rounded-lg p-3">
          <p className="text-text-secondary text-xs mb-1">最大回撤</p>
          <p className="text-sell font-medium">{formatMoney(maxDrawdown)}</p>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div>
        <h3 className="text-text-secondary text-sm mb-2">近期报表</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-text-secondary text-xs border-b border-border">
                <th className="text-left py-2 px-2">日期</th>
                <th className="text-right py-2 px-2">交易次数</th>
                <th className="text-right py-2 px-2">胜率</th>
                <th className="text-right py-2 px-2">净盈亏</th>
                <th className="text-right py-2 px-2">回撤</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.slice(-10).map((report) => (
                <tr key={report.id} className="border-b border-border text-sm">
                  <td className="py-2 px-2 text-text-secondary">
                    {new Date(report.periodDate).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="py-2 px-2 text-text-primary text-right">
                    {report.tradeCount}
                  </td>
                  <td
                    className={`py-2 px-2 text-right ${
                      report.winRate !== null && report.winRate !== undefined && report.winRate >= 0.5
                        ? 'text-buy'
                        : 'text-sell'
                    }`}
                  >
                    {formatPercent(report.winRate)}
                  </td>
                  <td
                    className={`py-2 px-2 text-right font-medium ${
                      Number(report.netProfit) >= 0 ? 'text-buy' : 'text-sell'
                    }`}
                  >
                    {formatMoney(report.netProfit)}
                  </td>
                  <td className="py-2 px-2 text-sell text-right">
                    {formatMoney(report.maxDrawdown)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}