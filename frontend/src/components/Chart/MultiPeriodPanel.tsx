import { useEffect, useState } from 'react';
import { ChartContainer, PeriodSelector } from './index';
import { api } from '@/services/api';
import { usePatternMarkers } from '@/components/Pattern';
import type { KlineData, Period, Pattern } from '@/types';
import type { CandlestickData, Time } from 'lightweight-charts';

interface MultiPeriodPanelProps {
  stockCode: string;
  periods?: Period[];
  patterns?: Pattern[];
}

export function MultiPeriodPanel({
  stockCode,
  periods = ['daily', '60min', '15min'],
  patterns = [],
}: MultiPeriodPanelProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(periods[0]);
  const [klineData, setKlineData] = useState<Record<Period, KlineData[]>>({} as Record<Period, KlineData[]>);
  const [isLoading, setIsLoading] = useState(false);

  // Filter patterns by current period
  const currentPeriodPatterns = patterns.filter(p => p.period === selectedPeriod);
  const chartMarkers = usePatternMarkers(currentPeriodPatterns);

  useEffect(() => {
    const fetchKlineData = async () => {
      setIsLoading(true);
      try {
        const response = await api.get<{
          stockCode: string;
          periods: Record<string, KlineData[]>;
        }>(`/market/multi-period?stock_code=${stockCode}&periods=${periods.join(',')}`);

        setKlineData(response.periods as Record<Period, KlineData[]>);
      } catch (error) {
        console.error('Failed to fetch kline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (stockCode) {
      fetchKlineData();
    }
  }, [stockCode, periods]);

  const currentData = klineData[selectedPeriod] || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <PeriodSelector value={selectedPeriod} onChange={(p) => setSelectedPeriod(p as Period)} />
        {isLoading && <span className="text-text-secondary text-sm">加载中...</span>}
      </div>

      <div className="flex-1 min-h-[500px]">
        <ChartContainer
          data={currentData.map((d) => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          })) as CandlestickData<Time>[]}
          stockCode={stockCode}
          period={selectedPeriod}
          markers={chartMarkers}
        />
      </div>
    </div>
  );
}