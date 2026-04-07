import { useState, useCallback } from 'react';
import type { TradeLogQuery } from '@/types';

interface LogSearchProps {
  query: TradeLogQuery;
  onSearch: (query: TradeLogQuery) => void;
  placeholder?: string;
}

function LogSearchInner({
  initialSearchText,
  query,
  onSearch,
  placeholder = '搜索股票代码...',
}: {
  initialSearchText: string;
  query: TradeLogQuery;
  onSearch: (query: TradeLogQuery) => void;
  placeholder?: string;
}) {
  const [searchText, setSearchText] = useState(initialSearchText);

  const handleSearch = useCallback(() => {
    const newQuery: TradeLogQuery = {
      ...query,
      stockCode: searchText.trim() || undefined,
      page: 1,
    };
    onSearch(newQuery);
  }, [searchText, query, onSearch]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setSearchText('');
    const newQuery: TradeLogQuery = {
      ...query,
      stockCode: undefined,
      page: 1,
    };
    onSearch(newQuery);
  }, [query, onSearch]);

  return (
    <div className="flex items-center gap-2" data-testid="log-search">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 bg-bg-tertiary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-text-accent"
        />
        {searchText && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="清除搜索"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
        aria-label="搜索"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>
    </div>
  );
}

export function LogSearch({ query, onSearch, placeholder }: LogSearchProps) {
  // Use key to reset internal state when external query changes
  const key = query.stockCode || 'empty';
  const initialSearchText = query.stockCode || '';

  return (
    <LogSearchInner
      key={key}
      initialSearchText={initialSearchText}
      query={query}
      onSearch={onSearch}
      placeholder={placeholder}
    />
  );
}
