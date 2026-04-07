import { TradeReport } from '@/components/Trade';
import { RiskWarningBanner } from '@/components/Compliance';

export default function ReportPage() {
  return (
    <div className="flex flex-col h-full p-6">
      {/* Risk Warning Banner */}
      <div className="mb-4">
        <RiskWarningBanner
          title="报表提示"
          content="以下数据为模拟交易统计结果，仅供学习分析使用，不构成任何投资建议。"
          dismissible={false}
        />
      </div>

      <h1 className="text-2xl font-bold text-text-primary mb-4">交易报表</h1>

      <div className="flex-1 overflow-hidden bg-bg-secondary rounded-lg p-4">
        <TradeReport />
      </div>
    </div>
  );
}