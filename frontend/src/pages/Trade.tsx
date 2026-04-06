import { RiskWarningBanner } from '@/components/Compliance';
import { useTradeBanner } from '@/hooks';

export default function TradePage() {
  const { showBanner, handleDismiss: handleBannerDismiss } = useTradeBanner();

  return (
    <div className="p-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-1 bg-bg-secondary rounded-lg p-4">
          <h2 className="text-lg font-medium text-text-primary mb-4">下单</h2>
          <p className="text-text-secondary text-sm">
            下单功能开发中...
          </p>
        </div>

        {/* Positions */}
        <div className="lg:col-span-2 bg-bg-secondary rounded-lg p-4">
          <h2 className="text-lg font-medium text-text-primary mb-4">持仓</h2>
          <p className="text-text-secondary text-sm">
            持仓管理功能开发中...
          </p>
        </div>
      </div>
    </div>
  );
}