interface OHLCDisplayProps {
  data: {
    time: unknown;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null;
  previousClose?: number;
}

export function OHLCDisplay({ data, previousClose }: OHLCDisplayProps) {
  if (!data) {
    return (
      <div className="flex items-center gap-4 text-text-secondary text-sm">
        <span>O: --</span>
        <span>H: --</span>
        <span>L: --</span>
        <span>C: --</span>
      </div>
    );
  }

  const { open, high, low, close } = data;
  const change = close - open;
  const changePercent = (change / open) * 100;
  const isUp = close >= open;

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <span className="text-text-secondary">O:</span>
        <span className="text-text-primary">{formatPrice(open)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-text-secondary">H:</span>
        <span className="text-kline-up">{formatPrice(high)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-text-secondary">L:</span>
        <span className="text-kline-down">{formatPrice(low)}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-text-secondary">C:</span>
        <span className={isUp ? 'text-kline-up' : 'text-kline-down'}>
          {formatPrice(close)}
        </span>
      </div>
      <div
        className={`ml-2 px-2 py-0.5 rounded ${
          isUp ? 'bg-kline-up/20 text-kline-up' : 'bg-kline-down/20 text-kline-down'
        }`}
      >
        {isUp ? '+' : ''}
        {formatPrice(change)} ({changePercent.toFixed(2)}%)
      </div>
      {previousClose !== undefined && (
        <div className="text-text-secondary text-xs">
          前收: {formatPrice(previousClose)}
        </div>
      )}
    </div>
  );
}