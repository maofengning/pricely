import { useEffect, useState, useRef, useCallback } from 'react';
import { Loading } from '@/components/common/Loading';
import { LogEntry } from './LogEntry';
import { LogSearch } from './LogSearch';
import { LogFilter } from './LogFilter';
import { LogEditor } from './LogEditor';
import { useLog } from '@/hooks/useLog';
import type { TradeLog, TradeLogQuery } from '@/types';

interface TradeLogProps {
  onLogSelect?: (log: TradeLog) => void;
}

// Virtual scroll configuration
const ITEM_HEIGHT = 220; // Approximate height of each log entry
const BUFFER_SIZE = 5; // Number of items to render above/below viewport

export function TradeLog({ onLogSelect }: TradeLogProps) {
  const {
    logs,
    total,
    page,
    pageSize,
    isLoading,
    error,
    editorOpen,
    editingLog,
    query,
    fetchLogs,
    selectLog,
    startEdit,
    startCreate,
    cancelEdit,
    deleteLog,
    updateQuery,
    changePage,
  } = useLog();

  // Virtual scroll state
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Filter panel visibility
  const [showFilter, setShowFilter] = useState(false);

  // Calculate virtual scroll parameters
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const endIndex = Math.min(
    logs.length,
    Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
  );
  const visibleLogs = logs.slice(startIndex, endIndex);
  const totalHeight = logs.length * ITEM_HEIGHT;

  // Handle scroll events for virtual scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Fetch logs on mount and when query changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Handle filter changes
  const handleQueryChange = useCallback((newQuery: TradeLogQuery) => {
    updateQuery(newQuery);
    fetchLogs(newQuery);
  }, [updateQuery, fetchLogs]);

  // Handle reset filter
  const handleResetFilter = useCallback(() => {
    const emptyQuery: TradeLogQuery = {};
    updateQuery(emptyQuery);
    fetchLogs(emptyQuery);
  }, [updateQuery, fetchLogs]);

  // Handle log selection
  const handleLogView = useCallback((log: TradeLog) => {
    selectLog(log);
    onLogSelect?.(log);
  }, [selectLog, onLogSelect]);

  // Handle log edit
  const handleLogEdit = useCallback((log: TradeLog) => {
    startEdit(log);
  }, [startEdit]);

  // Handle log delete
  const handleLogDelete = useCallback(async (log: TradeLog) => {
    const confirmed = window.confirm(
      `确认删除日志 "${log.stockCode}" (${log.period})？`
    );
    if (confirmed) {
      await deleteLog(log.id);
    }
  }, [deleteLog]);

  // Handle editor close
  const handleEditorClose = useCallback(() => {
    cancelEdit();
  }, [cancelEdit]);

  // Handle editor submit
  const handleEditorSubmit = useCallback((log: TradeLog) => {
    selectLog(log);
    onLogSelect?.(log);
  }, [selectLog, onLogSelect]);

  // Calculate pagination
  const totalPages = Math.ceil(total / pageSize);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  // Handle pagination
  const handlePrevPage = useCallback(() => {
    if (hasPrevPage) {
      changePage(page - 1);
    }
  }, [hasPrevPage, page, changePage]);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      changePage(page + 1);
    }
  }, [hasNextPage, page, changePage]);

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">交易日志</h1>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
            aria-label="新建日志"
          >
            + 新建
          </button>
        </div>
        <Loading text="加载日志..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6" data-testid="trade-log">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">交易日志</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`px-4 py-2 rounded transition-colors ${
              showFilter
                ? 'bg-text-accent text-white'
                : 'bg-bg-tertiary text-text-secondary hover:bg-bg-primary'
            }`}
            aria-label="筛选"
          >
            筛选
          </button>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
            aria-label="新建日志"
          >
            + 新建
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <LogSearch query={query} onSearch={handleQueryChange} />

      {/* Filter Panel */}
      {showFilter && (
        <LogFilter
          query={query}
          onQueryChange={handleQueryChange}
          onReset={handleResetFilter}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded text-red-500">
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-4">
        {/* Log List with Virtual Scroll */}
        <div
          ref={containerRef}
          className="flex-1 bg-bg-secondary rounded-lg border border-border overflow-y-auto"
          style={{ height: 'calc(100vh - 250px)' }}
          onScroll={handleScroll}
          data-testid="log-list"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <div className="text-center">
                <p className="mb-2">暂无交易日志</p>
                <button
                  onClick={startCreate}
                  className="px-4 py-2 bg-text-accent text-white rounded hover:bg-blue-600 transition-colors"
                >
                  创建第一条日志
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{ height: totalHeight, position: 'relative' }}
              className="p-4"
            >
              {visibleLogs.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    position: 'absolute',
                    top: (startIndex + index) * ITEM_HEIGHT,
                    width: '100%',
                    padding: '0 8px',
                  }}
                >
                  <LogEntry
                    log={log}
                    onView={handleLogView}
                    onEdit={handleLogEdit}
                    onDelete={handleLogDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={!hasPrevPage}
            className="px-4 py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="上一页"
          >
            上一页
          </button>
          <span className="text-text-secondary">
            第 {page} / {totalPages} 页 ({total} 条)
          </span>
          <button
            onClick={handleNextPage}
            disabled={!hasNextPage}
            className="px-4 py-2 bg-bg-tertiary text-text-secondary rounded hover:bg-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="下一页"
          >
            下一页
          </button>
        </div>
      )}

      {/* Editor Modal */}
      <LogEditor
        isOpen={editorOpen}
        editingLog={editingLog}
        onClose={handleEditorClose}
        onSubmit={handleEditorSubmit}
      />
    </div>
  );
}
