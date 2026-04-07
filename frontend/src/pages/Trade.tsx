import { TradePanel } from '@/components/Trade';
import { RiskWarningBanner } from '@/components/Compliance';
import { useTradeBanner } from '@/hooks';

export default function TradePage() {
  const { showBanner, handleDismiss: handleBannerDismiss } = useTradeBanner();

  return (
    <div className="flex flex-col h-full p-6">
      {/* Persistent Risk Warning Banner */}
      {showBanner && (
        <div className="mb-4">
          <RiskWarningBanner
            title="交易提示"
            content="您正在进行模拟交易，所有操作不涉及真实资金。请谨慎决策，切勿根据模拟结果进行实盘操作。"
            dismissible={true}
            onDismiss={handleBannerDismiss}
          />
        </div>
      )}

      <h1 className="text-2xl font-bold text-text-primary mb-4">模拟交易</h1>

      <div className="flex-1 overflow-hidden">
        <TradePanel className="h-full" />
      </div>
    </div>
  );
}