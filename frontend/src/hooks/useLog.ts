import { useCallback } from 'react';
import { logService } from '@/services/log';
import { useLogStore } from '@/stores/logStore';
import type { TradeLog, TradeLogCreate, TradeLogUpdate, TradeLogQuery } from '@/types';

export function useLog() {
  const {
    logs,
    total,
    page,
    pageSize,
    selectedLog,
    isLoading,
    error,
    editorOpen,
    editingLog,
    query,
    setLogs,
    setSelectedLog,
    setLoading,
    setError,
    openEditor,
    closeEditor,
    setQuery,
    addLog,
    updateLog,
    removeLog,
  } = useLogStore();

  const fetchLogs = useCallback(async (searchQuery?: TradeLogQuery) => {
    setLoading(true);
    setError(null);
    try {
      const effectiveQuery = searchQuery || query;
      const result = await logService.list(effectiveQuery);
      setLogs(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [query, setLogs, setLoading, setError]);

  const createLog = useCallback(async (data: TradeLogCreate): Promise<TradeLog | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await logService.create(data);
      addLog(result);
      closeEditor();
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [addLog, closeEditor, setLoading, setError]);

  const updateLogData = useCallback(async (id: string, data: TradeLogUpdate): Promise<TradeLog | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await logService.update(id, data);
      updateLog(id, result);
      closeEditor();
      return result;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateLog, closeEditor, setLoading, setError]);

  const deleteLog = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await logService.delete(id);
      removeLog(id);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [removeLog, setLoading, setError]);

  const selectLog = useCallback((log: TradeLog | null) => {
    setSelectedLog(log);
  }, [setSelectedLog]);

  const startEdit = useCallback((log: TradeLog) => {
    openEditor(log);
  }, [openEditor]);

  const startCreate = useCallback(() => {
    openEditor();
  }, [openEditor]);

  const cancelEdit = useCallback(() => {
    closeEditor();
  }, [closeEditor]);

  const updateQuery = useCallback((newQuery: TradeLogQuery) => {
    setQuery(newQuery);
  }, [setQuery]);

  const changePage = useCallback((newPage: number) => {
    const newQuery = { ...query, page: newPage };
    setQuery(newQuery);
    fetchLogs(newQuery);
  }, [query, setQuery, fetchLogs]);

  return {
    // State
    logs,
    total,
    page,
    pageSize,
    selectedLog,
    isLoading,
    error,
    editorOpen,
    editingLog,
    query,
    // Actions
    fetchLogs,
    createLog,
    updateLogData,
    deleteLog,
    selectLog,
    startEdit,
    startCreate,
    cancelEdit,
    updateQuery,
    changePage,
  };
}
